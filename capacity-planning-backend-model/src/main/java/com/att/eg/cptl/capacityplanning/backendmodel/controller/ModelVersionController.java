package com.att.eg.cptl.capacityplanning.backendmodel.controller;

import com.att.eg.cptl.capacityplanning.backendcommon.commonutilities.rest.RestResponse;
import com.att.eg.cptl.capacityplanning.backendmodel.model.ModelVersionInfo;
import com.att.eg.cptl.capacityplanning.backendmodel.service.ModelVersionService;
import java.io.IOException;
import org.codehaus.plexus.util.xml.pull.XmlPullParserException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@CrossOrigin(maxAge = 36000)
@RestController
public class ModelVersionController {

  @Autowired private ModelVersionService modelVersionService;

  @GetMapping(value = "/modelVersion", produces = MediaType.APPLICATION_JSON_VALUE)
  @PreAuthorize("hasAnyRole('ROLE_ADMIN','ROLE_READ_ONLY','ROLE_READ_AND_WRITE')")
  public RestResponse getModelVersion() throws IOException, XmlPullParserException {

    ModelVersionInfo versionInfo = modelVersionService.getModelVersionInfo();
    return new RestResponse(HttpStatus.OK, versionInfo);
  }
}
