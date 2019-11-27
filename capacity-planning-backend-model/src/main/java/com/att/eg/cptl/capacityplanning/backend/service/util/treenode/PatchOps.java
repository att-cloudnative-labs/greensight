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

    addFieldsToContent(nodeContent, fieldsToAdd);
    updateFieldsInContent(nodeContent, fieldsToUpdate);
    deleteFieldsInContent(nodeContent, fieldsToDelete);
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
              // ignoring the index for adding. i guess that's ok (:)
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
          Map<String, Object> arrayDeleteList = (Map<String, Object>) entry.getValue();
          List<Object> l = new ArrayList<>((List) content.get(entry.getKey()));
          for (Map.Entry<String, Object> updateEntry : arrayDeleteList.entrySet()) {
            // FIXME: this is most likely broken for multiple deletes
            l.remove(Integer.parseInt(updateEntry.getKey()));
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
