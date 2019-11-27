package com.att.eg.cptl.capacityplanning.backend.dao;

import com.att.eg.cptl.capacityplanning.backend.model.AppUser;
import java.util.Collection;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

public interface UserMongoRepository extends MongoRepository<AppUser, String> {

  List<AppUser> findByRole(String roleName);

  @Query("{'username': ?0, 'password': ?1}")
  AppUser findByUsernameAndPassword(String username, String password);

  AppUser findByUsername(String username);

  /**
   * Find all users whose ID appears in the "ids" List.
   *
   * @param ids The List of user IDs to retrieve the users for.
   * @return All users whose ID appears in the "ids" List.
   */
  List<AppUser> findByIdIn(Collection<String> ids);
}
