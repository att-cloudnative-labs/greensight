package com.att.eg.cptl.capacityplanning.backend.controller;

import static com.att.eg.cptl.capacityplanning.backend.util.IncomingRequestUtils.getTokenFromRequest;

import com.att.eg.cptl.capacityplanning.backend.controller.util.RestResponseUtil;
import com.att.eg.cptl.capacityplanning.backend.model.AppUser;
import com.att.eg.cptl.capacityplanning.backend.rest.RestResponse;
import com.att.eg.cptl.capacityplanning.backend.service.TreeNodeService;
import com.att.eg.cptl.capacityplanning.backend.service.UserAuthenticationService;
import com.att.eg.cptl.capacityplanning.backend.util.AuthorizationUtil;
import java.util.Date;
import java.util.Optional;
import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(maxAge = 36000)
@RestController
public class ProcessController {

  @Resource private TreeNodeService treeNodeService;

  @Resource private AuthorizationUtil authorizationUtil;
  @Autowired private UserAuthenticationService userAuthenticationService;

  @GetMapping(value = "/processes", produces = MediaType.APPLICATION_JSON_VALUE)
  @PreAuthorize("hasAnyRole('ROLE_ADMIN','ROLE_READ_ONLY','ROLE_READ_AND_WRITE')")
  public ResponseEntity<RestResponse> getAllVariables(
      HttpServletRequest request,
      @RequestParam(value = "since", required = false) Long updatedAfterTime,
      @RequestParam(value = "id", required = false) String processId) {
    String token = getTokenFromRequest(request);
    Optional<AppUser> optionalUser = userAuthenticationService.findUserByToken(token);
    if (!optionalUser.isPresent()) {
      return RestResponseUtil.createResponse(HttpStatus.UNAUTHORIZED);
    }
    Date updatedAfter = null;
    if (updatedAfterTime != null) {
      updatedAfter = new Date(updatedAfterTime);
    }
    AppUser user = optionalUser.get();
    return RestResponseUtil.createResponse(
        HttpStatus.OK,
        treeNodeService.getProcessInterfaceDescription(user, updatedAfter, processId));
  }
}
