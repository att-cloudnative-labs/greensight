package com.att.eg.cptl.capacityplanning.backend.service;

import com.att.eg.cptl.capacityplanning.backend.dao.SessionRepository;
import com.att.eg.cptl.capacityplanning.backend.dao.UserMongoRepository;
import com.att.eg.cptl.capacityplanning.backend.model.AppUser;
import com.att.eg.cptl.capacityplanning.backend.model.Session;
import java.util.Optional;
import org.codehaus.plexus.util.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class UserAuthenticationServiceImpl implements UserAuthenticationService {

  @Autowired private UserMongoRepository userMongoRepository;

  @Autowired private SessionRepository sessionRepository;

  @Override
  public Optional<AppUser> findUserByToken(String token) {
    Session session = sessionRepository.findById(token).get();
    String username = session.getUsername();
    if (StringUtils.isBlank(username)) {
      return Optional.empty();
    }
    AppUser user = userMongoRepository.findByUsername(username);
    if (user != null) {
      return Optional.of(user);
    }
    return Optional.empty();
  }
}
