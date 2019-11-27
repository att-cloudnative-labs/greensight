package com.att.eg.cptl.capacityplanning.backend.service;

import com.att.eg.cptl.capacityplanning.backend.model.AppUser;
import java.util.Optional;

@FunctionalInterface
public interface UserAuthenticationService {
  Optional<AppUser> findUserByToken(String token);
}
