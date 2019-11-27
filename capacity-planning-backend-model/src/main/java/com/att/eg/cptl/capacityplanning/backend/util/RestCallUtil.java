package com.att.eg.cptl.capacityplanning.backend.util;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Iterator;
import java.util.Map;
import java.util.Set;
import javax.annotation.Resource;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestOperations;

/** Utility class for performing REST calls to other services. */
@Component
public class RestCallUtil {
  @Resource private RestOperations restOperations;

  public ResponseEntity doGetCall(
      String host,
      String endpoint,
      Map<String, String> getParams,
      Map<String, String[]> headers,
      Object responseType)
      throws URISyntaxException {
    StringBuilder uriStringBuilder = new StringBuilder(host).append(endpoint);
    if (!getParams.isEmpty()) {
      uriStringBuilder.append("?");
      Set<String> getParamKeys = getParams.keySet();
      Iterator<String> getParamKeyIterator = getParamKeys.iterator();
      for (int curKey = 0; curKey < getParamKeys.size(); curKey++) {
        String key = getParamKeyIterator.next();
        String value = getParams.get(key);
        uriStringBuilder.append(key);
        uriStringBuilder.append("=");
        uriStringBuilder.append(value);
        if (curKey < getParamKeys.size()) {
          uriStringBuilder.append("&");
        }
      }
    }
    URI uri = new URI(uriStringBuilder.toString());

    HttpHeaders httpHeaders = new HttpHeaders();
    for (Map.Entry<String, String[]> mapEntry : headers.entrySet()) {
      for (String headerValue : mapEntry.getValue()) {
        httpHeaders.add(mapEntry.getKey(), headerValue);
      }
    }

    HttpEntity httpEntity = new HttpEntity(httpHeaders);

    if (responseType instanceof ParameterizedTypeReference) {
      return restOperations.exchange(
          uri, HttpMethod.GET, httpEntity, (ParameterizedTypeReference) responseType);
    } else {
      return restOperations.exchange(uri, HttpMethod.GET, httpEntity, (Class) responseType);
    }
  }
}
