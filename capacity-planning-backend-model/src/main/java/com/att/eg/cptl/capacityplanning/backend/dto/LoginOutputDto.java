package com.att.eg.cptl.capacityplanning.backend.dto;

import com.att.eg.cptl.capacityplanning.backend.model.auth.Role;
import lombok.Data;

@Data
public class LoginOutputDto {
  private String userId;
  private String token;
  private Role role;
}
