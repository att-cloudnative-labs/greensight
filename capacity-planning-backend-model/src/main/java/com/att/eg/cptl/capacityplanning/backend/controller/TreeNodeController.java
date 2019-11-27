package com.att.eg.cptl.capacityplanning.backend.controller;

import static com.att.eg.cptl.capacityplanning.backend.util.IncomingRequestUtils.getTokenFromRequest;

import com.att.eg.cptl.capacityplanning.backend.controller.history.NodeHistoryFilterType;
import com.att.eg.cptl.capacityplanning.backend.controller.util.RestResponseUtil;
import com.att.eg.cptl.capacityplanning.backend.dao.UserMongoRepository;
import com.att.eg.cptl.capacityplanning.backend.dto.treenode.TreeNodeDto;
import com.att.eg.cptl.capacityplanning.backend.dto.treenode.TreeNodeHistoryDto;
import com.att.eg.cptl.capacityplanning.backend.dto.treenode.TreeNodeVersionDto;
import com.att.eg.cptl.capacityplanning.backend.exception.InvalidFilterTypeException;
import com.att.eg.cptl.capacityplanning.backend.exception.NotFoundException;
import com.att.eg.cptl.capacityplanning.backend.model.AppUser;
import com.att.eg.cptl.capacityplanning.backend.model.ObjectHistory;
import com.att.eg.cptl.capacityplanning.backend.model.ObjectVersion;
import com.att.eg.cptl.capacityplanning.backend.model.TreeNodeContentPatch;
import com.att.eg.cptl.capacityplanning.backend.model.converter.ModelToDtoConverter;
import com.att.eg.cptl.capacityplanning.backend.model.treenode.TreeNode;
import com.att.eg.cptl.capacityplanning.backend.rest.RestResponse;
import com.att.eg.cptl.capacityplanning.backend.service.TreeNodeService;
import com.att.eg.cptl.capacityplanning.backend.service.UserAuthenticationService;
import com.att.eg.cptl.capacityplanning.backend.util.IncomingRequestUtils;
import io.micrometer.core.annotation.Timed;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import org.apache.commons.lang.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller for interacting with treenode structure, containing folders and nodes (models,
 * simulations, simulation results etc.)
 */
@Timed
@CrossOrigin(maxAge = 36000)
@RestController
public class TreeNodeController {
  @Resource private TreeNodeService treeNodeService;

  @Autowired private UserAuthenticationService userAuthenticationService;

  @Resource private ModelToDtoConverter modelToDtoConverter;

  @Resource private UserMongoRepository userRepository;

  @GetMapping("/tree/{nodeId}")
  @PreAuthorize("hasAnyRole('ROLE_ADMIN','ROLE_READ_ONLY','ROLE_READ_AND_WRITE')")
  public ResponseEntity<RestResponse> getNode(
      HttpServletRequest request,
      @PathVariable("nodeId") String nodeId,
      @RequestParam(value = "trashed", defaultValue = "false") Boolean showTrash,
      @RequestParam(value = "withChildren", defaultValue = "false") Boolean showChildren,
      @RequestParam(value = "sparse", defaultValue = "true") Boolean sparse,
      @RequestParam(value = "sparseChildren", defaultValue = "true") Boolean sparseChildren) {
    String token = getTokenFromRequest(request);
    Optional<AppUser> optionalUser = userAuthenticationService.findUserByToken(token);
    if (!optionalUser.isPresent()) {
      return RestResponseUtil.createResponse(HttpStatus.UNAUTHORIZED);
    }
    AppUser user = optionalUser.get();

    return RestResponseUtil.createResponse(
        HttpStatus.OK,
        treeNodeService.getNode(nodeId, showTrash, sparse, showChildren, sparseChildren, user));
  }

  @GetMapping("/tree/{nodeId}/trashed")
  @PreAuthorize("hasAnyRole('ROLE_ADMIN','ROLE_READ_AND_WRITE')")
  public ResponseEntity<RestResponse> getTrashedNodes(
      HttpServletRequest request, @PathVariable("nodeId") String nodeId) {
    String token = getTokenFromRequest(request);
    Optional<AppUser> optionalUser = userAuthenticationService.findUserByToken(token);
    if (!optionalUser.isPresent()) {
      return RestResponseUtil.createResponse(HttpStatus.UNAUTHORIZED);
    }
    AppUser user = optionalUser.get();

    return RestResponseUtil.createResponse(
        HttpStatus.OK, treeNodeService.getTrashedNodes(nodeId, user));
  }

  @DeleteMapping("/tree/{nodeId}")
  @PreAuthorize("hasAnyRole('ROLE_ADMIN','ROLE_READ_AND_WRITE')")
  public ResponseEntity<RestResponse> deleteNode(
      HttpServletRequest request,
      @PathVariable("nodeId") String nodeId,
      @RequestParam(value = "v", required = false) Long versionToDelete,
      @RequestParam(value = "remove", defaultValue = "false") Boolean remove) {
    String token = getTokenFromRequest(request);
    Optional<AppUser> optionalUser = userAuthenticationService.findUserByToken(token);
    if (!optionalUser.isPresent()) {
      return RestResponseUtil.createResponse(HttpStatus.UNAUTHORIZED);
    }
    AppUser user = optionalUser.get();

    List<String> nodeIdsDeleted = treeNodeService.deleteNode(nodeId, versionToDelete, remove, user);
    return RestResponseUtil.createResponse(HttpStatus.OK, nodeIdsDeleted);
  }

  @PostMapping("/tree/{nodeId}/recover")
  @PreAuthorize("hasAnyRole('ROLE_ADMIN','ROLE_READ_AND_WRITE')")
  public ResponseEntity<RestResponse> recoverNodeFromTrash(
      HttpServletRequest request,
      @PathVariable("nodeId") String nodeId,
      @RequestParam(value = "v", required = false) Long versionToDelete) {
    String token = getTokenFromRequest(request);
    Optional<AppUser> optionalUser = userAuthenticationService.findUserByToken(token);
    if (!optionalUser.isPresent()) {
      return RestResponseUtil.createResponse(HttpStatus.UNAUTHORIZED);
    }
    AppUser user = optionalUser.get();

    treeNodeService.restoreNodeFromTrash(nodeId, versionToDelete, user);
    return RestResponseUtil.createResponse(HttpStatus.OK);
  }

  @PostMapping("/tree")
  @PreAuthorize("hasAnyRole('ROLE_ADMIN','ROLE_READ_AND_WRITE')")
  public ResponseEntity<RestResponse> createNode(
      HttpServletRequest request, @RequestBody TreeNodeDto treeNodeDto) {
    String token = getTokenFromRequest(request);
    Optional<AppUser> optionalUser = userAuthenticationService.findUserByToken(token);
    if (!optionalUser.isPresent()) {
      return RestResponseUtil.createResponse(HttpStatus.UNAUTHORIZED);
    }
    AppUser user = optionalUser.get();

    TreeNodeDto createdTreeNodeDto = treeNodeService.createNode(treeNodeDto, user);
    return RestResponseUtil.createResponse(HttpStatus.CREATED, createdTreeNodeDto);
  }

  @PutMapping("/tree/{nodeId}")
  @PreAuthorize("hasAnyRole('ROLE_ADMIN','ROLE_READ_AND_WRITE')")
  public ResponseEntity<RestResponse> updateNode(
      HttpServletRequest request,
      @PathVariable("nodeId") String nodeId,
      @RequestBody TreeNodeDto treeNodeDto,
      @RequestParam(value = "v", required = false) Long versionToSave,
      @RequestParam(value = "sparse", defaultValue = "false") Boolean sparse) {
    String token = getTokenFromRequest(request);
    Optional<AppUser> optionalUser = userAuthenticationService.findUserByToken(token);
    if (!optionalUser.isPresent()) {
      return RestResponseUtil.createResponse(HttpStatus.UNAUTHORIZED);
    }
    AppUser user = optionalUser.get();

    treeNodeDto.setId(nodeId);

    TreeNodeDto updatedTreeNodeDto =
        treeNodeService.updateNode(treeNodeDto, user, versionToSave, sparse);
    if (sparse) {
      updatedTreeNodeDto.setContent(null);
    }
    return RestResponseUtil.createResponse(HttpStatus.OK, updatedTreeNodeDto);
  }

  @GetMapping(value = "/tree/{nodeId}/history", produces = MediaType.APPLICATION_JSON_VALUE)
  @PreAuthorize("hasAnyRole('ROLE_ADMIN','ROLE_READ_ONLY','ROLE_READ_AND_WRITE')")
  public ResponseEntity<RestResponse> getNodeHistory(
      HttpServletRequest request,
      @PathVariable String nodeId,
      @RequestParam(name = "sparse", defaultValue = "true") boolean sparse,
      @RequestParam(name = "filter", required = false) List<String> filter,
      @RequestParam(name = "alwaysInclude", required = false) String alwaysInclude) {
    boolean alwaysIncludeFirst = "first".equals(alwaysInclude);

    List<NodeHistoryFilterType> activeFilters = new ArrayList<>();
    if (filter != null) {
      filter.forEach(
          filterName -> {
            if (NodeHistoryFilterType.validateNodeHistoryFilterType(filterName)) {
              activeFilters.add(NodeHistoryFilterType.fromFilterName(filterName));
            } else {
              throw new InvalidFilterTypeException(
                  "Invalid filter type (\"" + filterName + "\") parameter in URL.");
            }
          });
    }
    String token = getTokenFromRequest(request);
    Optional<AppUser> optionalUser = userAuthenticationService.findUserByToken(token);
    if (!optionalUser.isPresent()) {
      return RestResponseUtil.createResponse(HttpStatus.UNAUTHORIZED);
    }
    AppUser user = optionalUser.get();

    List<TreeNodeVersionDto> nodeHistory =
        treeNodeService.getHistoryForNode(nodeId, user, activeFilters, alwaysIncludeFirst);
    if (nodeHistory == null) {
      throw new NotFoundException("Node history not found for node ID \"" + nodeId + "\".");
    }

    return RestResponseUtil.createResponse(HttpStatus.OK, nodeHistory);
  }

  @PutMapping(value = "/tree/{nodeId}/history", produces = MediaType.APPLICATION_JSON_VALUE)
  @PreAuthorize("hasAnyRole('ROLE_ADMIN','ROLE_READ_AND_WRITE')")
  public ResponseEntity<RestResponse> editNodeVersionComment(
      HttpServletRequest request,
      @PathVariable("nodeId") String nodeId,
      @RequestParam("version") Long versionId,
      @RequestBody Map<String, String> commentBody) {
    String token = getTokenFromRequest(request);
    Optional<AppUser> optionalUser = userAuthenticationService.findUserByToken(token);
    if (!optionalUser.isPresent()) {
      return RestResponseUtil.createResponse(HttpStatus.UNAUTHORIZED);
    }
    AppUser user = optionalUser.get();

    String comment = commentBody.get("comment");
    treeNodeService.editCommentForVersion(nodeId, versionId, comment, user);
    return RestResponseUtil.createResponse(HttpStatus.OK);
  }

  @PutMapping(value = "/tree/restore/{nodeId}", produces = MediaType.APPLICATION_JSON_VALUE)
  @PreAuthorize("hasAnyRole('ROLE_ADMIN','ROLE_READ_AND_WRITE')")
  public ResponseEntity<RestResponse> restoreNodeFromHistory(
      HttpServletRequest request,
      @PathVariable("nodeId") String nodeId,
      @RequestParam("version") Long versionId) {
    final String token = IncomingRequestUtils.getTokenFromRequest(request);

    Optional<AppUser> optionalUser = userAuthenticationService.findUserByToken(token);
    if (!optionalUser.isPresent()) {
      return RestResponseUtil.createResponse(HttpStatus.UNAUTHORIZED);
    }
    AppUser user = optionalUser.get();

    int newVersionId = treeNodeService.restoreVersionFromHistory(nodeId, versionId, user);
    return RestResponseUtil.createResponse(
        HttpStatus.OK, generateVersionNumberResultMap(null, newVersionId));
  }

  @PutMapping(value = "/tree/{nodeId}/patchContent", produces = MediaType.APPLICATION_JSON_VALUE)
  @PreAuthorize("hasAnyRole('ROLE_ADMIN','ROLE_READ_AND_WRITE')")
  public ResponseEntity<RestResponse> patchContentForNode(
      HttpServletRequest request,
      @PathVariable("nodeId") String nodeId,
      @RequestBody TreeNodeContentPatch treeNodeContentPatch,
      @RequestParam(value = "v", required = false) Long versionId) {
    final String token = IncomingRequestUtils.getTokenFromRequest(request);

    Optional<AppUser> optionalUser = userAuthenticationService.findUserByToken(token);
    if (!optionalUser.isPresent()) {
      return RestResponseUtil.createResponse(HttpStatus.UNAUTHORIZED);
    }
    AppUser user = optionalUser.get();

    treeNodeService.patchContentForNode(nodeId, versionId, treeNodeContentPatch, user);

    return RestResponseUtil.createResponse(HttpStatus.OK);
  }

  @PostMapping(value = "/tree/{nodeId}/move", produces = MediaType.APPLICATION_JSON_VALUE)
  @PreAuthorize("hasAnyRole('ROLE_ADMIN','ROLE_READ_AND_WRITE')")
  public ResponseEntity<RestResponse> moveNode(
      HttpServletRequest request,
      @PathVariable("nodeId") String nodeId,
      @RequestParam(value = "v") Long versionId,
      @RequestParam(value = "parentId") String parentId) {
    final String token = IncomingRequestUtils.getTokenFromRequest(request);

    Optional<AppUser> optionalUser = userAuthenticationService.findUserByToken(token);
    if (!optionalUser.isPresent()) {
      return RestResponseUtil.createResponse(HttpStatus.UNAUTHORIZED);
    }
    AppUser user = optionalUser.get();

    treeNodeService.moveNode(nodeId, versionId, parentId, user);

    return RestResponseUtil.createResponse(HttpStatus.OK);
  }

  private Map<String, Object> generateVersionNumberResultMap(
      TreeNodeDto treeNodeDto, int versionNumber) {
    Map<String, Object> resultMap = new HashMap<>();
    resultMap.put("node", treeNodeDto);
    resultMap.put("versionNumber", versionNumber);
    return resultMap;
  }

  private TreeNodeHistoryDto createTreeNodeHistoryDtoFromObjectHistory(
      ObjectHistory<TreeNode> nodeHistory, boolean sparse) {
    Map<String, Optional<AppUser>> idToUserMapping = new HashMap<>();
    TreeNodeHistoryDto treeNodeHistoryDto = new TreeNodeHistoryDto();
    treeNodeHistoryDto.setId(nodeHistory.getId());
    treeNodeHistoryDto.setObjectId(nodeHistory.getObjectId());
    List<ObjectVersion<TreeNodeDto>> previousVersionDtos = new ArrayList<>();
    for (ObjectVersion<TreeNode> previousVersion : nodeHistory.getPreviousVersions()) {
      ObjectVersion<TreeNodeDto> previousVersionDto = new ObjectVersion<>();
      previousVersionDto.setComment(previousVersion.getComment());
      previousVersionDto.setTimestamp(previousVersion.getTimestamp());
      previousVersionDto.setUserId(previousVersion.getUserId());
      if (StringUtils.isNotBlank(previousVersionDto.getUserId())) {
        if (idToUserMapping.get(previousVersionDto.getUserId()) == null) {
          idToUserMapping.put(
              previousVersion.getUserId(),
              Optional.ofNullable(userRepository.findById(previousVersion.getUserId()).get()));
        }
      }
      previousVersionDto.setVersionId(previousVersion.getVersionId());
      TreeNodeDto treeNodeOutputDto =
          modelToDtoConverter.createTreeNodeDto(
              previousVersion.getObject(), Collections.emptyList());
      treeNodeOutputDto.setVersion((long) previousVersion.getVersionId());
      previousVersionDto.setObject(treeNodeOutputDto);
      if (sparse && previousVersionDto.getObject() != null) {
        previousVersionDto.getObject().setContent(null);
      }
      previousVersionDtos.add(previousVersionDto);
    }
    treeNodeHistoryDto.setPreviousVersions(previousVersionDtos);
    return treeNodeHistoryDto;
  }
}
