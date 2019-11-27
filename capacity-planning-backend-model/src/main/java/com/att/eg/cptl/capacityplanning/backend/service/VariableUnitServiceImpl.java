package com.att.eg.cptl.capacityplanning.backend.service;

import com.att.eg.cptl.capacityplanning.backend.dao.VariableUnitRepository;
import com.att.eg.cptl.capacityplanning.backend.exception.BadRequestException;
import com.att.eg.cptl.capacityplanning.backend.model.VariableUnit;
import java.util.List;
import org.apache.commons.lang.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class VariableUnitServiceImpl implements VariableUnitService {

  @Autowired private VariableUnitRepository variableUnitRepository;

  @Override
  public List<VariableUnit> getAllVariableUnits() {
    return variableUnitRepository.findAll();
  }

  @Override
  public VariableUnit getVariableUnitById(String id) {
    return variableUnitRepository.findById(id).get();
  }

  @Override
  public VariableUnit addVariableUnit(VariableUnit unit) {
    if (StringUtils.isBlank(unit.getTitle())) {
      throw new BadRequestException("Title cannot be omitted or blank.");
    } else if (unit.getIsCustom() == null) {
      throw new BadRequestException("isCustom cannot be set to null or omitted.");
    }
    return variableUnitRepository.save(unit);
  }

  @Override
  public boolean updateVariableUnit(String id, VariableUnit unit) {
    if (StringUtils.isBlank(unit.getTitle())) {
      throw new BadRequestException("Title cannot be omitted or blank.");
    } else if (unit.getIsCustom() == null) {
      throw new BadRequestException("isCustom cannot be set to null or omitted.");
    }
    VariableUnit varUnit = getVariableUnitById(id);
    if (varUnit == null || varUnit.getId().equals(id)) {
      variableUnitRepository.save(unit);
      return true;
    }
    return false;
  }

  @Override
  public void deleteVariableUnit(String id, String userId) {
    VariableUnit unit = variableUnitRepository.findById(id).get();
    variableUnitRepository.deleteById(id);
  }
}
