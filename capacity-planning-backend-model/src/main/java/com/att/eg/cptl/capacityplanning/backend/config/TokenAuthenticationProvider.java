package com.att.eg.cptl.capacityplanning.backend.config;

import com.att.eg.cptl.capacityplanning.backend.model.AppUser;
import com.att.eg.cptl.capacityplanning.backend.service.UserAuthenticationService;
import java.util.Collections;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.authentication.dao.AbstractUserDetailsAuthenticationProvider;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;

@Component
public final class TokenAuthenticationProvider extends AbstractUserDetailsAuthenticationProvider {
  @Autowired private UserAuthenticationService userAuthenticationService;

  @Override
  protected void additionalAuthenticationChecks(
      final UserDetails d, final UsernamePasswordAuthenticationToken auth) {
    // Nothing to do
  }

  @Override
  protected UserDetails retrieveUser(
      final String username, final UsernamePasswordAuthenticationToken authentication) {
    final Object token = authentication.getCredentials();
    Optional<AppUser> appUserOptional = userAuthenticationService.findUserByToken((String) token);
    if (!appUserOptional.isPresent()) {
      throw new UsernameNotFoundException("Cannot find user with authentication token=" + token);
    }
    return convertAppUserToUserDetails(appUserOptional.get());
  }

  private UserDetails convertAppUserToUserDetails(AppUser appUser) {
    GrantedAuthority userAuthority = null;
    if (appUser.getRole() != null) {
      userAuthority = new SimpleGrantedAuthority("ROLE_" + appUser.getRole().toString());
    }
    return new User(
        appUser.getUsername(),
        appUser.getPassword() == null ? "null" : appUser.getPassword(),
        true,
        true,
        true,
        true,
        userAuthority == null ? Collections.emptyList() : Collections.singletonList(userAuthority));
  }
}
