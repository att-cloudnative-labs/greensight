package com.att.eg.cptl.capacityplanning.backend.service;

import com.att.eg.cptl.capacityplanning.backend.dao.LayoutRepository;
import com.att.eg.cptl.capacityplanning.backend.exception.BadRequestException;
import com.att.eg.cptl.capacityplanning.backend.model.Layout;
import java.util.List;
import org.apache.commons.lang.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.att.eg.cptl.capacityplanning.backend.dto.LayoutDto;


@Service
public class LayoutServiceImpl implements LayoutService {

  @Autowired private LayoutRepository layoutRepository;
  @Override
  public Layout getLayoutById(String ownerId) {
    return layoutRepository.findByOwnerId(ownerId);
  }

  @Override
  public Layout addLayout(Layout layout, String ownerId ) {
    layout.setOwnerId(ownerId);
    return layoutRepository.save(layout);
  }

  @Override
  public boolean updateLayout(String ownerId,Layout layout) {

    Layout curLayout = getLayoutById(ownerId);
    if (curLayout == null || curLayout.getOwnerId().equals(ownerId)) {
        curLayout.setContent(layout.getContent());
      layoutRepository.save(curLayout);
      return true;
    }
    return false;
  }

}
