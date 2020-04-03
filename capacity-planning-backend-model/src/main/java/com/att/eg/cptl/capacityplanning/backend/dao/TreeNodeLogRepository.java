package com.att.eg.cptl.capacityplanning.backend.dao;

import com.att.eg.cptl.capacityplanning.backend.model.treenode.TreeNodeLog;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface TreeNodeLogRepository
    extends MongoRepository<TreeNodeLog, String>, TreeNodeLogRepositoryCustom {}
