package com.att.eg.cptl.capacityplanning.backend.dao;

import com.att.eg.cptl.capacityplanning.backend.model.UserGroup;
import java.util.Collection;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

public interface UserGroupRepository extends MongoRepository<UserGroup, String> {
  UserGroup findByUserGroupName(String userGroupName);

  // Get a list of groups by ID.
  @Query(value = "{'_id': ?0}")
  List<UserGroup> findByIdIn(Collection<String> ids);

  // Get all groups that contain this user ID.
  @Query(value = "{'users': ?0}")
  List<UserGroup> findByUserId(String userId);
}
