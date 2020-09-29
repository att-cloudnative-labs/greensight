package com.att.eg.cptl.capacityplanning.backend.dao;

import com.att.eg.cptl.capacityplanning.backend.model.Layout;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;


public interface LayoutRepository extends MongoRepository<Layout, String> {

@Query(value = "{'ownerId': ?0}")
Layout findByOwnerId(String ownerId);
}