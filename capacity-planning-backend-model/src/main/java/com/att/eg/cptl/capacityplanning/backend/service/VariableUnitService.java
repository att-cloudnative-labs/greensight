package com.att.eg.cptl.capacityplanning.backend.service;

import com.att.eg.cptl.capacityplanning.backend.model.VariableUnit;
import java.util.List;

public interface VariableUnitService {
  List<VariableUnit> getAllVariableUnits();

  VariableUnit getVariableUnitById(String id);

  VariableUnit addVariableUnit(VariableUnit unit);

  boolean updateVariableUnit(String id, VariableUnit unit);

  void deleteVariableUnit(String id, String userId);
}
