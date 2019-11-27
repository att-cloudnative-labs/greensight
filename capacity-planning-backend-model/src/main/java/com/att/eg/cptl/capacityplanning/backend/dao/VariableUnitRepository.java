package com.att.eg.cptl.capacityplanning.backend.dao;

import com.att.eg.cptl.capacityplanning.backend.model.VariableUnit;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface VariableUnitRepository extends MongoRepository<VariableUnit, String> {

  List<VariableUnit> findByIsCustom(boolean isCustom);
}
