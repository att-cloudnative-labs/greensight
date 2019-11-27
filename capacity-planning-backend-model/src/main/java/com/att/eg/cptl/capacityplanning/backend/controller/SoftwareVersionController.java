package com.att.eg.cptl.capacityplanning.backend.controller;

import com.att.eg.cptl.capacityplanning.backend.model.SoftwareVersionInfo;
import com.att.eg.cptl.capacityplanning.backend.rest.RestResponse;
import com.att.eg.cptl.capacityplanning.backend.service.SoftwareVersionService;
import java.io.IOException;
import org.codehaus.plexus.util.xml.pull.XmlPullParserException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@CrossOrigin(maxAge = 36000)
@RestController
public class SoftwareVersionController {

  @Autowired private SoftwareVersionService softwareVersionService;

  @GetMapping(value = "/version", produces = MediaType.APPLICATION_JSON_VALUE)
  public RestResponse getModelVersion() throws IOException, XmlPullParserException {

    SoftwareVersionInfo versionInfo = softwareVersionService.getModelVersionInfo();
    return new RestResponse(HttpStatus.OK, versionInfo);
  }
}
