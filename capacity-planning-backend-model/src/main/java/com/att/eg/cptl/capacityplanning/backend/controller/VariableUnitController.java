package com.att.eg.cptl.capacityplanning.backend.controller;

import com.att.eg.cptl.capacityplanning.backend.controller.util.RestResponseUtil;
import com.att.eg.cptl.capacityplanning.backend.model.AppUser;
import com.att.eg.cptl.capacityplanning.backend.model.VariableUnit;
import com.att.eg.cptl.capacityplanning.backend.rest.RestResponse;
import com.att.eg.cptl.capacityplanning.backend.service.VariableUnitService;
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

@CrossOrigin(maxAge = 36000)
@RestController
public class VariableUnitController {

  @Autowired private VariableUnitService variableUnitService;

  @Resource private AuthorizationUtil authorizationUtil;

  @GetMapping(value = "/variableUnit", produces = MediaType.APPLICATION_JSON_VALUE)
  @PreAuthorize("hasAnyRole('ROLE_ADMIN','ROLE_READ_ONLY','ROLE_READ_AND_WRITE')")
  public RestResponse getAllVariableUnits() {
    List<VariableUnit> units = variableUnitService.getAllVariableUnits();
    return new RestResponse(HttpStatus.OK, units);
  }

  @GetMapping(value = "/variableUnit/{variableUnitId}", produces = MediaType.APPLICATION_JSON_VALUE)
  @PreAuthorize("hasAnyRole('ROLE_ADMIN','ROLE_READ_ONLY','ROLE_READ_AND_WRITE')")
  public RestResponse getVariableUnitById(@PathVariable("variableUnitId") String id) {
    VariableUnit unit = variableUnitService.getVariableUnitById(id);
    return new RestResponse(HttpStatus.OK, unit);
  }

  @PostMapping(value = "/variableUnit", produces = MediaType.APPLICATION_JSON_VALUE)
  @PreAuthorize("hasAnyRole('ROLE_ADMIN','ROLE_READ_AND_WRITE')")
  public RestResponse addVariableUnit(@Valid @RequestBody VariableUnit unit, Errors errors) {
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
    VariableUnit newUnit = variableUnitService.addVariableUnit(unit);
    return new RestResponse(HttpStatus.CREATED, newUnit);
  }

  @DeleteMapping(
      value = "/variableUnit/{variableUnitId}",
      produces = MediaType.APPLICATION_JSON_VALUE)
  @PreAuthorize("hasAnyRole('ROLE_ADMIN','ROLE_READ_AND_WRITE')")
  public ResponseEntity<RestResponse> deleteVariableUnit(
      @PathVariable("variableUnitId") String id, HttpServletRequest request) {
    final String token = MiscUtil.getTokenFromRequest(request);
    AppUser user = authorizationUtil.getUserFromToken(token);
    String userId;
    if (user != null) {
      userId = user.getId();
    } else {
      return RestResponseUtil.createResponse(HttpStatus.UNAUTHORIZED);
    }
    variableUnitService.deleteVariableUnit(id, userId);
    return RestResponseUtil.createResponse(HttpStatus.OK);
  }

  @PutMapping(value = "/variableUnit/{variableUnitId}", produces = MediaType.APPLICATION_JSON_VALUE)
  @PreAuthorize("hasAnyRole('ROLE_ADMIN','ROLE_READ_AND_WRITE')")
  public RestResponse updateVariableUnit(
      @PathVariable("variableUnitId") String id,
      @Valid @RequestBody VariableUnit unit,
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
    unit.setId(id);
    variableUnitService.updateVariableUnit(id, unit);
    return new RestResponse(HttpStatus.OK);
  }
}
