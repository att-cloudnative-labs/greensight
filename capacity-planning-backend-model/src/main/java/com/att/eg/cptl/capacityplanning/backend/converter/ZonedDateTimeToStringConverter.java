package com.att.eg.cptl.capacityplanning.backend.converter;

import com.att.eg.cptl.capacityplanning.backend.util.Constants;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import org.springframework.core.convert.converter.Converter;
import org.springframework.data.convert.WritingConverter;

/** Used to convert a ZonedDateTime object to a String in ISO-8601 format. */
@WritingConverter
public class ZonedDateTimeToStringConverter implements Converter<ZonedDateTime, String> {
  private static final DateTimeFormatter dateTimeFormatter =
      DateTimeFormatter.ofPattern(Constants.ZONED_DATE_TIME_FORMAT);

  @Override
  public String convert(ZonedDateTime zonedDateTime) {
    if (zonedDateTime == null) {
      return null;
    }
    return dateTimeFormatter.format(zonedDateTime);
  }
}
