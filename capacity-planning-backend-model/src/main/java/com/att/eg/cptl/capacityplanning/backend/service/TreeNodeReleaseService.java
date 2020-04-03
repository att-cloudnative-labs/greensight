package com.att.eg.cptl.capacityplanning.backend.service;

import com.att.eg.cptl.capacityplanning.backend.dto.treenode.TreeNodeReleaseDto;
import com.att.eg.cptl.capacityplanning.backend.model.AppUser;
import java.util.List;

public interface TreeNodeReleaseService {
  TreeNodeReleaseDto createRelease(TreeNodeReleaseDto release, AppUser user);

  List<TreeNodeReleaseDto> getReleasesForNode(String nodeId, boolean fetchAll, AppUser user);

  TreeNodeReleaseDto getRelease(String releaseId, AppUser user);

  TreeNodeReleaseDto updateRelease(String releaseId, TreeNodeReleaseDto release, AppUser user);
}
