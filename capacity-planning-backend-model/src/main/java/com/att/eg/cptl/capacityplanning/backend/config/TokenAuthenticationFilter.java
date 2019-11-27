package com.att.eg.cptl.capacityplanning.backend.config;

import static java.util.Optional.ofNullable;
import static lombok.AccessLevel.PRIVATE;
import static org.apache.commons.lang3.StringUtils.removeStart;

import com.att.eg.cptl.capacityplanning.backend.dao.SessionRepository;
import com.att.eg.cptl.capacityplanning.backend.model.Session;
import com.att.eg.cptl.capacityplanning.backend.util.Constants;
import com.att.eg.cptl.capacityplanning.backend.util.SessionUtils;
import java.io.IOException;
import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import lombok.experimental.FieldDefaults;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.CredentialsExpiredException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AbstractAuthenticationProcessingFilter;
import org.springframework.security.web.authentication.session.SessionAuthenticationException;
import org.springframework.security.web.util.matcher.RequestMatcher;

@FieldDefaults(level = PRIVATE, makeFinal = true)
public final class TokenAuthenticationFilter extends AbstractAuthenticationProcessingFilter {

  private final SessionRepository sessionRepository;

  private final int expirySeconds;

  public TokenAuthenticationFilter(
      final RequestMatcher requiresAuth,
      final SessionRepository sessionRepository,
      int expirySeconds) {
    super(requiresAuth);
    this.sessionRepository = sessionRepository;
    this.expirySeconds = expirySeconds;
  }

  @Override
  public Authentication attemptAuthentication(
      final HttpServletRequest request, final HttpServletResponse response) {
    final String param =
        ofNullable(request.getHeader(Constants.AUTHORIZATION)).orElse(request.getParameter("t"));

    final String token =
        ofNullable(param)
            .map(value -> removeStart(value, Constants.TOKEN_BEARER))
            .map(String::trim)
            .orElseThrow(() -> new BadCredentialsException("Missing Authentication Token"));

    Session session = sessionRepository.findById(token).get();

    if (session == null || session.getIssueTime() == null) {
      throw new SessionAuthenticationException("Invalid token");
    }

    if (SessionUtils.isSessionExpired(session, expirySeconds)) {
      throw new CredentialsExpiredException("Token has expired.");
    }

    final Authentication auth = new UsernamePasswordAuthenticationToken(token, token);
    return getAuthenticationManager().authenticate(auth);
  }

  @Override
  protected void successfulAuthentication(
      final HttpServletRequest request,
      final HttpServletResponse response,
      final FilterChain chain,
      final Authentication authResult)
      throws IOException, ServletException {
    super.successfulAuthentication(request, response, chain, authResult);
    chain.doFilter(request, response);
  }
}
