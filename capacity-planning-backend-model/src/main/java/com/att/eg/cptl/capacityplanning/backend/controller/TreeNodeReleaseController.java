package com.att.eg.cptl.capacityplanning.backend.controller;

import static com.att.eg.cptl.capacityplanning.backend.util.IncomingRequestUtils.getTokenFromRequest;

import com.att.eg.cptl.capacityplanning.backend.controller.util.RestResponseUtil;
import com.att.eg.cptl.capacityplanning.backend.dto.treenode.TreeNodeReleaseDto;
import com.att.eg.cptl.capacityplanning.backend.exception.UnauthorizedException;
import com.att.eg.cptl.capacityplanning.backend.model.AppUser;
import com.att.eg.cptl.capacityplanning.backend.rest.RestResponse;
import com.att.eg.cptl.capacityplanning.backend.service.TreeNodeReleaseService;
import com.att.eg.cptl.capacityplanning.backend.service.UserAuthenticationService;
import java.util.Optional;
import javax.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(maxAge = 36000)
@RestController
public class TreeNodeReleaseController {

  @Autowired private TreeNodeReleaseService releaseService;

  @Autowired private UserAuthenticationService userAuthenticationService;

  private AppUser getUser(HttpServletRequest request) {
    String token = getTokenFromRequest(request);
    Optional<AppUser> optionalUser = userAuthenticationService.findUserByToken(token);
    if (!optionalUser.isPresent()) {
      throw new UnauthorizedException("USER IS NOT AUTHORIZED");
    }
    return optionalUser.get();
  }

  @GetMapping(value = "/release/{releaseId}", produces = MediaType.APPLICATION_JSON_VALUE)
  @PreAuthorize("hasAnyRole('ROLE_ADMIN','ROLE_READ_ONLY','ROLE_READ_AND_WRITE')")
  public ResponseEntity<RestResponse> getRelease(
      HttpServletRequest request, @PathVariable("releaseId") String releaseId) {
    return RestResponseUtil.createResponse(
        HttpStatus.OK, releaseService.getRelease(releaseId, getUser(request)));
  }

  @PutMapping(value = "/release/{releaseId}", produces = MediaType.APPLICATION_JSON_VALUE)
  @PreAuthorize("hasAnyRole('ROLE_ADMIN','ROLE_READ_AND_WRITE')")
  public ResponseEntity<RestResponse> updateRelease(
      HttpServletRequest request,
      @PathVariable("releaseId") String releaseId,
      @RequestBody TreeNodeReleaseDto releaseDto) {

    return RestResponseUtil.createResponse(
        HttpStatus.OK, releaseService.updateRelease(releaseId, releaseDto, getUser(request)));
  }

  @PostMapping(value = "/release", produces = MediaType.APPLICATION_JSON_VALUE)
  @PreAuthorize("hasAnyRole('ROLE_ADMIN','ROLE_READ_AND_WRITE')")
  public ResponseEntity<RestResponse> createRelease(
      HttpServletRequest request, @RequestBody TreeNodeReleaseDto releaseDto) {

    return RestResponseUtil.createResponse(
        HttpStatus.OK, releaseService.createRelease(releaseDto, getUser(request)));
  }

  @GetMapping(value = "/release", produces = MediaType.APPLICATION_JSON_VALUE)
  @PreAuthorize("hasAnyRole('ROLE_ADMIN','ROLE_READ_ONLY','ROLE_READ_AND_WRITE')")
  public ResponseEntity<RestResponse> getReleasesForNode(
      HttpServletRequest request,
      @RequestParam(value = "nodeId") String nodeId,
      @RequestParam(value = "all", required = false, defaultValue = "false") boolean fetchAll) {
    return RestResponseUtil.createResponse(
        HttpStatus.OK, releaseService.getReleasesForNode(nodeId, fetchAll, getUser(request)));
  }
}
