package com.att.eg.cptl.capacityplanning.backend.controller;

import com.att.eg.cptl.capacityplanning.backend.controller.util.RestResponseUtil;
import com.att.eg.cptl.capacityplanning.backend.model.AppUser;
import com.att.eg.cptl.capacityplanning.backend.model.Layout;
import com.att.eg.cptl.capacityplanning.backend.rest.RestResponse;
import com.att.eg.cptl.capacityplanning.backend.service.LayoutService;
import com.att.eg.cptl.capacityplanning.backend.util.AuthorizationUtil;
import com.att.eg.cptl.capacityplanning.backend.util.MiscUtil;
import java.util.List;
import java.util.stream.Collectors;
import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.Errors;
import org.springframework.validation.ObjectError;
import org.springframework.web.bind.annotation.*;
import com.att.eg.cptl.capacityplanning.backend.dto.LayoutDto;


@CrossOrigin(maxAge = 36000)
@RestController
public class LayoutController {

  @Autowired private LayoutService layoutService;

  @Resource private AuthorizationUtil authorizationUtil;

  @GetMapping(value = "/layout/{ownerId}", produces = MediaType.APPLICATION_JSON_VALUE)
  @PreAuthorize("hasAnyRole('ROLE_ADMIN','ROLE_READ_ONLY','ROLE_READ_AND_WRITE')")
  public RestResponse getLayoutByOwnerId(@PathVariable("ownerId") String ownerId) {
    Layout layout = layoutService.getLayoutById(ownerId);
    return new RestResponse(HttpStatus.OK, layout);
  }

  @PostMapping(value = "/layout/{ownerId}", produces = MediaType.APPLICATION_JSON_VALUE)
  @PreAuthorize("hasAnyRole('ROLE_ADMIN','ROLE_READ_AND_WRITE')")
  public RestResponse addLayout(@Valid @RequestBody Layout layout, @PathVariable("ownerId") String ownerId, Errors errors) {
    if (errors.hasErrors()) {
      RestResponse result = new RestResponse();
      result.setErrorMessage(
          errors
              .getAllErrors()
              .stream()
              .map(ObjectError::getDefaultMessage)
              .collect(Collectors.joining(",")));
      result.setStatus(HttpStatus.BAD_REQUEST);
      return result;
    }
    Layout newLayout = layoutService.addLayout(layout, ownerId);
    return new RestResponse(HttpStatus.CREATED, newLayout);
  }

  @PutMapping(value = "/layout/{ownerId}", produces = MediaType.APPLICATION_JSON_VALUE)
  @PreAuthorize("hasAnyRole('ROLE_ADMIN','ROLE_READ_AND_WRITE')")
  public RestResponse updateLayout(
      @PathVariable("ownerId") String ownerId,
      @Valid @RequestBody Layout layout,
      Errors errors) {
    if (errors.hasErrors()) {
      RestResponse result = new RestResponse();
      result.setErrorMessage(
          errors
              .getAllErrors()
              .stream()
              .map(ObjectError::getDefaultMessage)
              .collect(Collectors.joining(",")));
      result.setStatus(HttpStatus.BAD_REQUEST);
      return result;
    }
    layout.setOwnerId(ownerId);
    layoutService.updateLayout(ownerId, layout);
    return new RestResponse(HttpStatus.OK);
  }

}