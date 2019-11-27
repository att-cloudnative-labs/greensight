package com.att.eg.cptl.capacityplanning.backend.util;

import com.att.eg.cptl.capacityplanning.backend.dao.UserMongoRepository;
import com.att.eg.cptl.capacityplanning.backend.exception.UserNotFoundException;
import com.att.eg.cptl.capacityplanning.backend.model.AppUser;
import com.att.eg.cptl.capacityplanning.backend.model.OwnedObject;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class DeleteUtils {
  private String defaultOwnerUsername;
  private String defaultOwnerId;

  @Autowired
  public DeleteUtils(
      @Value("${ownedobject.defaultownerusername}") String defaultOwnerUsername,
      UserMongoRepository userRepository,
      @Value("${spring.profiles.active:}") String springProfilesString) {
    this.defaultOwnerUsername = defaultOwnerUsername;
    AppUser user = userRepository.findByUsername(defaultOwnerUsername);
    if (user != null) {
      this.defaultOwnerId = user.getId();
    } else {
      if (StringUtils.isNotBlank(springProfilesString)) {
        String[] springProfiles = springProfilesString.split(",");
        for (String profile : springProfiles) {
          if ("test".equals(profile)) {
            return;
          }
        }
      }
      throw new UserNotFoundException(
          "User not found for default user to be used for "
              + "orphaned documents when a user is deleted.");
    }
  }

  public void updateDocumentOwnerAfterDelete(OwnedObject ownedObject) {
    ownedObject.setOwnerId(defaultOwnerId);
  }
}
