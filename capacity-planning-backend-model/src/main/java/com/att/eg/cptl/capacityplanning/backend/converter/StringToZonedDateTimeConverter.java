package com.att.eg.cptl.capacityplanning.backend.converter;

import com.att.eg.cptl.capacityplanning.backend.util.Constants;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import org.codehaus.plexus.util.StringUtils;
import org.springframework.core.convert.converter.Converter;
import org.springframework.data.convert.ReadingConverter;

/** Used to convert a String in ISO-8601 format to a ZonedDateTime object. */
@ReadingConverter
public class StringToZonedDateTimeConverter implements Converter<String, ZonedDateTime> {
  private static final DateTimeFormatter dateTimeFormatter =
      DateTimeFormatter.ofPattern(Constants.ZONED_DATE_TIME_FORMAT);

  @Override
  public ZonedDateTime convert(String s) {
    if (StringUtils.isBlank(s)) {
      return null;
    }
    return ZonedDateTime.from(dateTimeFormatter.parse(s));
  }
}
