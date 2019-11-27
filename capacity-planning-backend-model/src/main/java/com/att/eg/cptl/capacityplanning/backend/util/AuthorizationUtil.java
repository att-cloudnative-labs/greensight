package com.att.eg.cptl.capacityplanning.backend.util;

import com.att.eg.cptl.capacityplanning.backend.model.AppUser;
import com.att.eg.cptl.capacityplanning.backend.model.auth.Role;
import com.att.eg.cptl.capacityplanning.backend.service.UserAuthenticationService;
import java.util.Optional;
import org.codehaus.plexus.util.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class AuthorizationUtil {
  @Autowired private UserAuthenticationService userAuthenticationService;

  public boolean hasPermissionToUpdateUser(String token, String userId) {
    Optional<AppUser> sessionUserOptional = userAuthenticationService.findUserByToken(token);
    if (!sessionUserOptional.isPresent()) {
      return false;
    }
    AppUser sessionUser = sessionUserOptional.get();
    if (isAdminUser(sessionUser) || userId.equals(sessionUser.getId())) {
      return true;
    }
    return false;
  }

  public boolean hasPermissionToSearchUser(String token, String userId) {
    AppUser tokenUser = getUserFromToken(token);
    return isAdminUser(tokenUser) || isUser(tokenUser, userId);
  }

  public AppUser getUserFromToken(String token) {
    Optional<AppUser> sessionUserOptional = userAuthenticationService.findUserByToken(token);
    return sessionUserOptional.orElse(null);
  }

  private boolean isAdminUser(AppUser user) {
    return user.getRole() != null && user.getRole().equals(Role.ADMIN);
  }

  public boolean isAdminUser(String token) {
    AppUser u = getUserFromToken(token);
    return u != null && isAdminUser(u);
  }

  private boolean isUser(AppUser user, String userId) {
    return !StringUtils.isBlank(userId) && userId.equals(user.getId());
  }
}
