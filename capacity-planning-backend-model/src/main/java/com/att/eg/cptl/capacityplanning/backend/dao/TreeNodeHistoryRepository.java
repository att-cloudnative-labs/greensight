package com.att.eg.cptl.capacityplanning.backend.dao;

import com.att.eg.cptl.capacityplanning.backend.model.treenode.TreeNodeVersion;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface TreeNodeHistoryRepository
    extends MongoRepository<TreeNodeVersion, String>, TreeNodeHistoryRepositoryCustom {}
