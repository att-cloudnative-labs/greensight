package com.att.eg.cptl.capacityplanning.backend.service.util.treenode;

import com.att.eg.cptl.capacityplanning.backend.model.TreeNodeContentPatch;
import com.att.eg.cptl.capacityplanning.backend.model.treenode.TreeNode;
import com.google.gson.Gson;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class PatchOps {

  public static void patchNode(TreeNode treeNode, TreeNodeContentPatch treeNodeContentPatch) {
    Map<String, Object> nodeContent = treeNode.getContent();
    if (nodeContent == null) {
      nodeContent = new HashMap<>();
    }
    Map<String, Object> fieldsToAdd = treeNodeContentPatch.getAdded();
    Map<String, Object> fieldsToUpdate = treeNodeContentPatch.getUpdated();
    Map<String, Object> fieldsToDelete = treeNodeContentPatch.getDeleted();

    deleteFieldsInContent(nodeContent, fieldsToDelete);
    addFieldsToContent(nodeContent, fieldsToAdd);
    updateFieldsInContent(nodeContent, fieldsToUpdate);
  }

  public static Map<String, Object> cloneContent(Map<String, Object> content) {
    Gson gson = new Gson();
    String jsonString = gson.toJson(content);
    return gson.fromJson(jsonString, Map.class);
  }

  private static void addFieldsToContent(
      Map<String, Object> content, Map<String, Object> fieldsToAdd) {
    if (fieldsToAdd != null) {
      for (Map.Entry<String, Object> entry : fieldsToAdd.entrySet()) {
        if (entry.getValue() instanceof Map) {
          if (content.get(entry.getKey()) == null) {
            content.put(entry.getKey(), new HashMap<>());
          } else if ((content.get(entry.getKey()) instanceof List)) {
            Map<String, Object> arrayAddList = (Map<String, Object>) entry.getValue();
            List<Object> l = new ArrayList<>((List) content.get(entry.getKey()));
            for (Map.Entry<String, Object> updateEntry : arrayAddList.entrySet()) {
              try {
                int listIndex = Integer.parseInt(updateEntry.getKey());
                if (updateEntry.getValue() instanceof Map
                    && l.size() >= listIndex + 1
                    && l.get(listIndex) instanceof Map) {
                  addFieldsToContent(
                      (Map<String, Object>) l.get(listIndex),
                      (Map<String, Object>) updateEntry.getValue());
                  continue;
                }
              } catch (NumberFormatException | IndexOutOfBoundsException e) {
              }

              l.add(updateEntry.getValue());
            }
            content.put(entry.getKey(), l);
            continue;
          } else if (!(content.get(entry.getKey()) instanceof HashMap)) {
            content.put(entry.getKey(), new HashMap<>((Map<String, Object>) entry.getValue()));
          }
          addFieldsToContent(
              (Map<String, Object>) content.get(entry.getKey()),
              (Map<String, Object>) entry.getValue());
        } else {
          content.put(entry.getKey(), entry.getValue());
        }
      }
    }
  }

  private static void updateFieldsInContent(
      Map<String, Object> content, Map<String, Object> fieldsToUpdate) {
    if (fieldsToUpdate != null) {
      for (Map.Entry<String, Object> entry : fieldsToUpdate.entrySet()) {
        if (entry.getValue() instanceof Map) {
          if (content.get(entry.getKey()) == null) {
            content.put(entry.getKey(), new HashMap<>());
          } else if ((content.get(entry.getKey()) instanceof List)) {
            Map<String, Object> arrayUpdateList = (Map<String, Object>) entry.getValue();
            List<Object> l = new ArrayList<>((List) content.get(entry.getKey()));
            for (Map.Entry<String, Object> updateEntry : arrayUpdateList.entrySet()) {
              Integer arrayIndex = Integer.parseInt(updateEntry.getKey());
              if (l.get(arrayIndex) instanceof HashMap
                  && updateEntry.getValue() instanceof HashMap) {
                updateFieldsInContent(
                    (Map<String, Object>) l.get(arrayIndex),
                    (Map<String, Object>) updateEntry.getValue());
              } else {
                l.set(arrayIndex, updateEntry.getValue());
              }
            }
            content.put(entry.getKey(), l);
            continue;
          } else if (!(content.get(entry.getKey()) instanceof HashMap)) {
            content.put(entry.getKey(), new HashMap<>((Map<String, Object>) entry.getValue()));
          }
          updateFieldsInContent(
              (Map<String, Object>) content.get(entry.getKey()),
              (Map<String, Object>) entry.getValue());
        } else {
          content.put(entry.getKey(), entry.getValue());
        }
      }
    }
  }

  private static void deleteFieldsInContent(
      Map<String, Object> content, Map<String, Object> fieldsToDelete) {
    if (fieldsToDelete != null) {
      for (Map.Entry<String, Object> entry : fieldsToDelete.entrySet()) {
        if ((content.get(entry.getKey()) instanceof List)) {
          Map<String, Object> arrayDeleteMap = (Map<String, Object>) entry.getValue();
          List<Map.Entry<String, Object>> arrayDeleteList =
              new ArrayList(arrayDeleteMap.entrySet());
          arrayDeleteList.sort((e1, e2) -> e2.getKey().compareTo(e1.getKey()));
          List<Object> l = new ArrayList<>((List) content.get(entry.getKey()));
          for (Map.Entry<String, Object> updateEntry : arrayDeleteList) {
            // FIXME: this is most likely broken for multiple deletes
            if (updateEntry.getValue() == null) {
              l.remove(Integer.parseInt(updateEntry.getKey()));
            } else {
              deleteFieldsInContent(
                  (Map<String, Object>) l.get(Integer.parseInt(updateEntry.getKey())),
                  (Map<String, Object>) updateEntry.getValue());
            }
          }
          content.put(entry.getKey(), l);
          continue;
        }
        if (entry.getValue() instanceof Map) {
          deleteFieldsInContent(
              (Map<String, Object>) content.get(entry.getKey()),
              (Map<String, Object>) entry.getValue());
        } else {
          content.remove(entry.getKey());
        }
      }
    }
  }
}
