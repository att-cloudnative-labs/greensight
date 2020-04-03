package com.att.eg.cptl.capacityplanning.backend.controller.util.treenode;

import com.att.eg.cptl.capacityplanning.backend.dto.treenode.TreeNodeDto;
import com.att.eg.cptl.capacityplanning.backend.exception.InvalidInputException;
import com.att.eg.cptl.capacityplanning.backend.model.treenode.NodeType;
import com.att.eg.cptl.capacityplanning.backend.model.treenode.TreeNode;
import com.google.common.collect.ImmutableMap;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Consumer;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Component;

@Component
public class TreeNodeContentValidationUtil {
  private Map<NodeType, Consumer<Map<String, Object>>> validators;

  private static final List<String> VALID_PARAM_TYPE_VALUES =
      Arrays.asList(new String[] {"NUMBER", "STRING", "BOOLEAN", "BREAKDOWN", "TAG"});

  private static final List<String> VALID_CONFIG_TYPE_VALUES =
      Arrays.asList(new String[] {"NUMBER", "STRING", "BOOLEAN"});

  private static final List<String> VALID_PROCESS_TYPE_VALUES =
      Arrays.asList(new String[] {"PROCESSING_ELEMENT", "GRAPH_MODEL"});

  private static final List<String> VALID_GENERATES_RESPONSE_TYPE_VALUES =
      Arrays.asList(new String[] {"ALWAYS", "NEVER", "PASSTHROUGH"});

  private static final DateTimeFormatter MONTH_STRING_DATE_FORMATTER =
      DateTimeFormatter.ofPattern("yyyy-MM");

  public TreeNodeContentValidationUtil() {
    validators = new EnumMap(NodeType.class);

    validators.put(
        NodeType.MODEL,
        modelContent -> {
          checkForRequiredAndUnrecognisedFields(
              modelContent,
              Collections.emptyList(),
              ImmutableMap.<String, Class>builder()
                  .put("objectId", String.class)
                  .put("objectType", String.class)
                  .put("inports", Map.class)
                  .put("outports", Map.class)
                  .put("processes", Map.class)
                  .put("connections", Map.class)
                  .put("variables", Map.class)
                  .put("metadata", Object.class)
                  .put("processInterface", Map.class)
                  .put("processDependencies", List.class)
                  .build(),
              false,
              false);

          try {
            if (modelContent.get("inports") != null) {
              Collection<Map<String, Object>> inports =
                  ((Map<String, Map<String, Object>>) modelContent.get("inports")).values();
              inports.forEach(
                  inport -> {
                    String configType = (String) inport.get("configType");
                    validateConfigType("configType", "Inport", configType);

                    String generatesResponse = (String) inport.get("generatesResponse");
                    validateGeneratesResponseType("generatesResponse", "Inport", generatesResponse);

                    if (modelContent.get("inports") != null) {
                      checkForRequiredAndUnrecognisedFields(
                          inport,
                          Arrays.asList("name", "requiredTypes", "generatesResponse"),
                          ImmutableMap.<String, Class>builder()
                              .put("objectId", String.class)
                              .put("objectType", String.class)
                              .put("name", String.class)
                              .put("requiredTypes", List.class)
                              .put("desiredUnits", List.class)
                              .put("defaultParam", Map.class)
                              .put("configType", String.class)
                              .put("generatesResponse", String.class)
                              .put("index", Number.class)
                              .put("metadata", Object.class)
                              .build(),
                          false,
                          false);
                    }
                  });
            }
          } catch (ClassCastException cce) {
            throw new InvalidInputException(
                "Field \"inports\" is not of the expected type. "
                    + "Should be a Map of ID to Inport.");
          }

          try {
            if (modelContent.get("outports") != null) {
              Collection<Map<String, Object>> outports =
                  ((Map<String, Map<String, Object>>) modelContent.get("outports")).values();
              outports.forEach(
                  outport -> {
                    String configType = (String) outport.get("configType");
                    validateConfigType("configType", "Outport", configType);

                    if (modelContent.get("outports") != null) {
                      checkForRequiredAndUnrecognisedFields(
                          outport,
                          Arrays.asList("name"),
                          ImmutableMap.<String, Class>builder()
                              .put("objectId", String.class)
                              .put("objectType", String.class)
                              .put("name", String.class)
                              .put("generatesResponse", String.class)
                              .put("requiredTypes", List.class)
                              .put("types", List.class)
                              .put("unit", String.class)
                              .put("configType", String.class)
                              .put("index", Number.class)
                              .put("metadata", Object.class)
                              .build(),
                          false,
                          false);
                    }
                  });
            }
          } catch (ClassCastException cce) {
            throw new InvalidInputException(
                "Field \"outports\" is not of the expected type. "
                    + "Should be a Map of ID to Outport.");
          }

          try {
            if (modelContent.get("processes") != null) {
              Collection<Map<String, Object>> processes =
                  ((Map<String, Map<String, Object>>) modelContent.get("processes")).values();
              processes.forEach(
                  process -> {
                    String type = (String) process.get("type");
                    validateProcessType("type", "Process", type);

                    if (modelContent.get("processes") != null) {
                      checkForRequiredAndUnrecognisedFields(
                          process,
                          Arrays.asList("type", "ref"),
                          ImmutableMap.<String, Class>builder()
                              .put("objectId", String.class)
                              .put("objectType", String.class)
                              .put("ref", String.class)
                              .put("versionId", String.class)
                              .put("label", String.class)
                              .put("inports", Map.class)
                              .put("type", String.class)
                              .put("outports", Map.class)
                              .put("metadata", Object.class)
                              .put("name", String.class)
                              .put("tracking", String.class)
                              .put("releaseNr", Number.class)
                              .build(),
                          false,
                          false);
                    }
                  });
            }
          } catch (ClassCastException cce) {
            throw new InvalidInputException(
                "Field \"processes\" is not of the expected type. "
                    + "Should be a Map of ID to Process.");
          }

          try {
            if (modelContent.get("connections") != null) {
              Collection<Map<String, Object>> connections =
                  ((Map<String, Map<String, Object>>) modelContent.get("connections")).values();
              connections.forEach(
                  connection -> {
                    if (modelContent.get("connection") != null) {
                      checkForRequiredAndUnrecognisedFields(
                          connection,
                          Arrays.asList("source", "destination"),
                          ImmutableMap.<String, Class>builder()
                              .put("objectId", String.class)
                              .put("objectType", String.class)
                              .put("source", String.class)
                              .put("destination", String.class)
                              .put("metadata", Object.class)
                              .put("label", Object.class)
                              .build(),
                          false,
                          false);
                    }
                  });
            }
          } catch (ClassCastException cce) {
            throw new InvalidInputException(
                "Field \"connections\" is not of the expected type. "
                    + "Should be a Map of ID to Connection.");
          }
        });

    validators.put(NodeType.MODELTEMPLATE, validators.get(NodeType.MODEL));

    validators.put(NodeType.FOLDER, folderContent -> {});

    validators.put(
        NodeType.SIMULATION,
        simulationContent -> {
          checkForRequiredAndUnrecognisedFields(
              simulationContent,
              Arrays.asList("ref", "stepStart", "stepLast"),
              ImmutableMap.<String, Class>builder()
                  .put("id", String.class)
                  .put("objectId", String.class)
                  .put("objectType", String.class)
                  .put("modelVersion", String.class)
                  .put("modelName", String.class)
                  .put("monteCarloIterations", Number.class)
                  .put("metadata", Object.class)
                  .put("stepStart", String.class)
                  .put("stepLast", String.class)
                  .put("scenarios", Map.class)
                  .put("reportType", String.class)
                  .put("inports", Map.class)
                  .put("ref", String.class)
                  .put("tracking", String.class)
                  .put("releaseNr", Number.class)
                  .put("forecasts", Object.class)
                  .build(),
              false,
              false);

          checkMonthStringFormat("stepStart", (String) simulationContent.get("stepStart"));
          checkMonthStringFormat("stepLast", (String) simulationContent.get("stepLast"));
        });

    validators.put(NodeType.SIMULATIONRESULT, simulationResultContent -> {});

    /* don't validate forecast data for now */
    validators.put(NodeType.FC_PROJECT, forecastProjectContent -> {});
    validators.put(NodeType.FC_SHEET, forecastSheetContent -> {});
    validators.put(NodeType.FC_VARIABLE_NUM, forecastVariableNumericalContent -> {});
    validators.put(NodeType.FC_VARIABLE_BD, forecastVariableBreakdownContent -> {});
    validators.put(NodeType.META, metaContent -> {});
  }

  public void validateTreeNodeContent(TreeNode treeNode) {
    if (treeNode == null) {
      throw new InvalidInputException("Node is null.");
    }
    if (treeNode.getType() == null) {
      throw new InvalidInputException("Node has no \"type\" field set.");
    }
    Consumer<Map<String, Object>> validator = validators.get(treeNode.getType());
    if (validator == null) {
      throw new InvalidInputException("Unrecognised node type!");
    }
    validator.accept(treeNode.getContent());
  }

  public void validateTreeNodeDtoContent(TreeNodeDto treeNodeDto) {
    if (treeNodeDto == null) {
      throw new InvalidInputException("Node is null.");
    }
    if (treeNodeDto.getType() == null) {
      throw new InvalidInputException("Node has no \"type\" field set.");
    }
    Consumer<Map<String, Object>> validator = validators.get(treeNodeDto.getType());
    if (validator == null) {
      throw new InvalidInputException("Unrecognised node type!");
    }
    validator.accept(treeNodeDto.getContent());
  }

  private void checkForRequiredAndUnrecognisedFields(
      Map<String, Object> content,
      List<String> requiredFields,
      Map<String, Class> fieldTypes,
      boolean nullContentAllowed,
      boolean allowUnrecognisedFields) {
    if (content == null && !nullContentAllowed) {
      throw new InvalidInputException(
          "\"content\" field is null - content must be populated for this type.");
    } else if (content == null) {
      return;
    }
    Set<String> contentFields = content.keySet();
    requiredFields.forEach(
        requiredField -> {
          if (!contentFields.contains(requiredField)) {
            throw new InvalidInputException(
                "Required field \"" + requiredField + "\" not present in content.");
          }
        });
    if (!allowUnrecognisedFields) {
      Set<String> validFields = fieldTypes.keySet();
      for (String contentField : contentFields) {
        if (!validFields.contains(contentField)) {
          throw new InvalidInputException("Invalid field in content: \"" + contentField + "\"");
        }
      }
    }
    for (Map.Entry<String, Class> fieldNameAndType : fieldTypes.entrySet()) {
      String fieldName = fieldNameAndType.getKey();
      Class expectedType = fieldNameAndType.getValue();
      if (content.get(fieldName) != null && !expectedType.isInstance(content.get(fieldName))) {
        throw new InvalidInputException(
            "Field \""
                + fieldName
                + "\" is not of the expected type: "
                + expectedType.getSimpleName());
      }
    }
  }

  private void validateParamType(String fieldName, String graphObjectType, String paramType) {
    if (paramType != null && !VALID_PARAM_TYPE_VALUES.contains(paramType)) {
      throw new InvalidInputException(
          fieldName
              + " on "
              + graphObjectType
              + " has invalid value: \""
              + paramType
              + "\". Should be one of "
              + VALID_PARAM_TYPE_VALUES);
    }
  }

  private void validateConfigType(String fieldName, String graphObjectType, String configType) {
    if (configType != null && !VALID_CONFIG_TYPE_VALUES.contains(configType)) {
      throw new InvalidInputException(
          fieldName
              + " on "
              + graphObjectType
              + " has invalid value: \""
              + configType
              + "\". Should be one of "
              + VALID_CONFIG_TYPE_VALUES);
    }
  }

  private void validateProcessType(String fieldName, String graphObjectType, String processType) {
    if (processType != null && !VALID_PROCESS_TYPE_VALUES.contains(processType)) {
      throw new InvalidInputException(
          fieldName
              + " on "
              + graphObjectType
              + " has invalid value: \""
              + processType
              + "\". Should be one of "
              + VALID_PROCESS_TYPE_VALUES);
    }
  }

  private void validateGeneratesResponseType(
      String fieldName, String graphObjectType, String generatesResponseType) {
    if (generatesResponseType != null
        && !VALID_GENERATES_RESPONSE_TYPE_VALUES.contains(generatesResponseType)) {
      throw new InvalidInputException(
          fieldName
              + " on "
              + graphObjectType
              + " has invalid value: \""
              + generatesResponseType
              + "\". Should be one of "
              + VALID_GENERATES_RESPONSE_TYPE_VALUES);
    }
  }

  private void checkMonthStringFormat(String fieldName, String dateString) {
    if (StringUtils.isBlank(dateString)) {
      throw new InvalidInputException("No month set for field: \"" + fieldName + "\"");
    }
    try {
      YearMonth.parse(dateString, MONTH_STRING_DATE_FORMATTER);
    } catch (DateTimeParseException dtpe) {
      throw new InvalidInputException(
          "Invalid month format for field \"" + fieldName + "\": \"" + dateString + "\"");
    }
  }
}
