package com.att.eg.cptl.capacityplanning.backendmodel.dao;

import com.att.eg.cptl.capacityplanning.backendcommon.commonmodel.dao.TreeNodeRepository;
import com.att.eg.cptl.capacityplanning.backendcommon.commonmodel.exception.InvalidInputException;
import com.att.eg.cptl.capacityplanning.backendcommon.commonmodel.exception.NotFoundException;
import com.att.eg.cptl.capacityplanning.backendcommon.commonmodel.model.treenode.NodeType;
import com.att.eg.cptl.capacityplanning.backendcommon.commonmodel.model.treenode.TreeNode;
import com.att.eg.cptl.capacityplanning.backendcommon.commonmodel.util.objecthistory.TreeNodeHistoryService;
import javax.annotation.Resource;
import org.springframework.stereotype.Component;

@Component
public class SimulationRepository {
  @Resource private TreeNodeRepository treeNodeRepository;

  @Resource private TreeNodeHistoryService treeNodeHistoryService;

  public TreeNode getSimulationByIdAndVersion(String id, Integer version) {
    TreeNode simulation;
    if (version == null) {
      simulation = treeNodeRepository.findOne(id);
      if (simulation == null || !NodeType.SIMULATION.equals(simulation.getType())) {
        throw new NotFoundException("Simulation with ID \"" + id + "\" not found.");
      }
    } else {
      if (version <= 0) {
        throw new InvalidInputException("Version cannot be 0 or a negative number.");
      }
      simulation = treeNodeHistoryService.getVersion(id, version);
      if (simulation == null || !NodeType.SIMULATION.equals(simulation.getType())) {
        throw new NotFoundException(
            "Simulation with ID \"" + id + "\" and version " + version + " not found.");
      }
    }
    return simulation;
  }
}
