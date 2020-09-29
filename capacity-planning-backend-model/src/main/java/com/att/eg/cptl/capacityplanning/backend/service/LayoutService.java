package com.att.eg.cptl.capacityplanning.backend.service;
import com.att.eg.cptl.capacityplanning.backend.dto.LayoutDto;

import com.att.eg.cptl.capacityplanning.backend.model.Layout;
import java.util.List;

public interface LayoutService {

   Layout getLayoutById(String ownerId);

   Layout addLayout(Layout layout, String ownerId);

   boolean updateLayout(String ownerId, Layout layout);
}
