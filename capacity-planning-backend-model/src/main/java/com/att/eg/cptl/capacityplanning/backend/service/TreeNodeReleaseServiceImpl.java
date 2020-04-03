package com.att.eg.cptl.capacityplanning.backend.service;

import static com.att.eg.cptl.capacityplanning.backend.service.util.treenode.DependencyOps.getDeepNodeDependencies;

import com.att.eg.cptl.capacityplanning.backend.controller.util.treenode.TreeNodeContentValidationUtil;
import com.att.eg.cptl.capacityplanning.backend.dao.*;
import com.att.eg.cptl.capacityplanning.backend.dto.treenode.TreeNodeReleaseDto;
import com.att.eg.cptl.capacityplanning.backend.exception.NotFoundException;
import com.att.eg.cptl.capacityplanning.backend.model.AppUser;
import com.att.eg.cptl.capacityplanning.backend.model.converter.DtoToModelConverter;
import com.att.eg.cptl.capacityplanning.backend.model.converter.ModelToDtoConverter;
import com.att.eg.cptl.capacityplanning.backend.model.treenode.*;
import com.att.eg.cptl.capacityplanning.backend.service.util.treenode.DtoOps;
import com.att.eg.cptl.capacityplanning.backend.service.util.treenode.NodeLogOps;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import javax.annotation.Resource;
import org.springframework.stereotype.Service;

@Service
public class TreeNodeReleaseServiceImpl extends TreeNodeBaseService
    implements TreeNodeReleaseService {

  private final TreeNodeLogRepository treeNodeLogRepository;

  @Resource private ModelToDtoConverter modelToDtoConverter;

  @Resource private DtoToModelConverter dtoToModelConverter;

  @Resource private UserMongoRepository userMongoRepository;

  @Resource private TreeNodeContentValidationUtil treeNodeContentValidationUtil;

  public TreeNodeReleaseServiceImpl(
      TreeNodeRepository treeNodeRepository, TreeNodeLogRepository treeNodeLogRepository) {
    super(treeNodeRepository);
    this.treeNodeLogRepository = treeNodeLogRepository;
  }

  protected TreeNodeBase getDepNode(TreeNodeDependency dep) {
    if (dep.getReleaseNr() != null && dep.getTrackingMode() == TrackingMode.FIXED) {
      return this.treeNodeLogRepository.findRelease(dep.getRef(), dep.getReleaseNr(), true);
    }
    return null;
  }

  @Override
  public TreeNodeReleaseDto createRelease(TreeNodeReleaseDto releaseDto, AppUser user) {
    BaseNodeInfo baseNodeInfo = getNodeForUser(releaseDto.getObjectId(), user, true);
    assertPermission(baseNodeInfo, Permission.CREATE);

    TreeNode baseNode = baseNodeInfo.getTreeNode();
    if (baseNode.getType() != NodeType.FC_SHEET && baseNode.getType() != NodeType.MODEL) {
      throw new IllegalArgumentException("must not past in nodes that are not FC_SHEET or MODEL");
    }

    if (releaseDto.getTreeNode() == null || releaseDto.getTreeNode().getContent() == null) {
      throw new IllegalArgumentException("must pass in tree node with content to create a release");
    }

    treeNodeContentValidationUtil.validateTreeNodeDtoContent(releaseDto.getTreeNode());
    baseNode.setContent(releaseDto.getTreeNode().getContent());

    TreeNode tn =
        dtoToModelConverter.convertDtoToTreeNode(releaseDto.getTreeNode(), baseNode.getAncestors());
    tn.setVersion(baseNode.getVersion());

    List<String> deepDependencies = getDeepNodeDependencies(tn, this::getDepNode);
    if (deepDependencies.contains(tn.getId())) {
      throw new IllegalArgumentException("there is a cyclic dependency in this release");
    }
    tn.setProcessDependencies(deepDependencies);

    TreeNodeLog tnl =
        treeNodeLogRepository.insertRelease(
            NodeLogOps.create(tn, user, releaseDto.getDescription()));

    TreeNodeReleaseDto savedDto = modelToDtoConverter.convertToTreeNodeReleaseDto(tnl);
    savedDto.setCurrentUserAccessPermissions(baseNodeInfo.getPermissions());
    DtoOps.lookupOwnerNames(Collections.singletonList(savedDto), this.userMongoRepository);
    return savedDto;
  }

  @Override
  public List<TreeNodeReleaseDto> getReleasesForNode(
      String nodeId, boolean fetchAll, AppUser user) {
    BaseNodeInfo baseNodeInfo = getNodeForUser(nodeId, user, true);
    assertPermission(baseNodeInfo, Permission.READ);

    List<TreeNodeLog> releases =
        fetchAll
            ? treeNodeLogRepository.findReleases(nodeId, true)
            : Collections.singletonList(treeNodeLogRepository.findLatestRelease(nodeId, true));
    List<TreeNodeReleaseDto> availableReleases = new ArrayList<>();
    for (TreeNodeLog releaseToAdd : releases) {
      TreeNodeReleaseDto dto = modelToDtoConverter.convertToTreeNodeReleaseDto(releaseToAdd);
      dto.setDescription(releaseToAdd.getLogComment());
      dto.setCurrentUserAccessPermissions(baseNodeInfo.getPermissions());
      availableReleases.add(dto);
    }
    DtoOps.lookupOwnerNames(availableReleases, this.userMongoRepository);
    return availableReleases;
  }

  @Override
  public TreeNodeReleaseDto getRelease(String releaseId, AppUser user) {
    TreeNodeLog release = treeNodeLogRepository.findLogEntry(releaseId, true);
    if (release == null) {
      throw new NotFoundException("no such release");
    }
    BaseNodeInfo baseNodeInfo = getNodeForUser(release.getBaseNodeId(), user, true);
    assertPermission(baseNodeInfo, Permission.READ);

    TreeNodeReleaseDto dto = modelToDtoConverter.convertToTreeNodeReleaseDto(release);
    dto.setCurrentUserAccessPermissions(baseNodeInfo.getPermissions());
    DtoOps.lookupOwnerNames(Collections.singletonList(dto), this.userMongoRepository);

    return dto;
  }

  @Override
  public TreeNodeReleaseDto updateRelease(
      String releaseId, TreeNodeReleaseDto releaseDto, AppUser user) {
    TreeNodeLog releaseToBeUpdated = treeNodeLogRepository.findLogEntry(releaseId, true);
    if (releaseToBeUpdated == null) {
      throw new NotFoundException("no such release");
    }
    BaseNodeInfo baseNodeInfo = getNodeForUser(releaseToBeUpdated.getBaseNodeId(), user, true);
    assertPermission(baseNodeInfo, Permission.MODIFY);
    this.treeNodeLogRepository.updateLogComment(
        releaseToBeUpdated.getId(), releaseDto.getDescription());
    return releaseDto;
  }
}
