package com.att.eg.cptl.capacityplanning.backend.service;

import com.att.eg.cptl.capacityplanning.backend.dao.SessionRepository;
import com.att.eg.cptl.capacityplanning.backend.dao.UserMongoRepository;
import com.att.eg.cptl.capacityplanning.backend.dto.AppUserInputDto;
import com.att.eg.cptl.capacityplanning.backend.dto.LoginInputDto;
import com.att.eg.cptl.capacityplanning.backend.dto.LoginOutputDto;
import com.att.eg.cptl.capacityplanning.backend.dto.SettingDto;
import com.att.eg.cptl.capacityplanning.backend.exception.BadRequestException;
import com.att.eg.cptl.capacityplanning.backend.exception.UnauthorizedException;
import com.att.eg.cptl.capacityplanning.backend.exception.UserExistsException;
import com.att.eg.cptl.capacityplanning.backend.exception.UserNotFoundException;
import com.att.eg.cptl.capacityplanning.backend.model.AppUser;
import com.att.eg.cptl.capacityplanning.backend.model.Session;
import com.att.eg.cptl.capacityplanning.backend.model.UserGroup;
import com.att.eg.cptl.capacityplanning.backend.model.auth.Role;
import com.att.eg.cptl.capacityplanning.backend.model.converter.DtoToModelConverter;
import com.att.eg.cptl.capacityplanning.backend.service.util.LdapClient;
import com.att.eg.cptl.capacityplanning.backend.util.Constants;
import com.att.eg.cptl.capacityplanning.backend.util.DeleteUtils;
import java.time.LocalDateTime;
import java.util.*;
import javax.annotation.Resource;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.PropertySource;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@PropertySource("application.properties")
@PropertySource(value = "file:///opt/ldap.config", ignoreResourceNotFound = true)
@Service
public class UserServiceImpl implements UserService {

  @Autowired private UserMongoRepository userMongoRepository;

  @Resource private DeleteUtils deleteUtils;

  @Autowired private SessionRepository sessionRepository;

  @Autowired private LdapClient ldapClient;

  @Autowired private UserGroupService userGroupService;

  @Resource private DtoToModelConverter dtoToModelConverter;

  @Value("${ldap.enabled:false}")
  private boolean ldapEnabled;

  @Override
  public List<AppUser> getAllUsers() {
    return userMongoRepository.findAll();
  }

  @Override
  public AppUser getUserById(String userId) {
    return userMongoRepository.findById(userId).get();
  }

  @Override
  public void addUser(AppUserInputDto appUserInputDto) {
    if (StringUtils.isBlank(appUserInputDto.getPassword())) {
      throw new BadRequestException("Password cannot be blank or omitted.");
    }
    AppUser user = dtoToModelConverter.convertInputDtoToAppUser(appUserInputDto);
    validateAppUser(user);
    user.setSettings(Constants.getDefaultUserSettings());
    if (userMongoRepository.findByUsername(user.getUsername()) != null) {
      throw new UserExistsException(
          "User with username \"" + user.getUsername() + "\" already exists.");
    }
    userMongoRepository.save(user);
  }

  @Override
  public AppUser updateUser(
      String userId, AppUserInputDto appUserInputDto, boolean allowRoleChange) {
    AppUser dbUser = userMongoRepository.findById(userId).get();
    AppUser user = dtoToModelConverter.convertInputDtoToAppUser(appUserInputDto);
    validateAppUser(user);
    if (dbUser == null) {
      throw new UserNotFoundException("User with id \"" + userId + "\" does not exist.");
    }

    if (!dbUser.getRole().equals(user.getRole()) && !allowRoleChange) {
      throw new UnauthorizedException("Role change not allowed.");
    }

    // FIXME: a generic solution for just updating changed fields
    // would be nicer, but for now we just make sure the username is not set to null.
    if (user.getUsername() == null) {
      user.setUsername(dbUser.getUsername());
    }
    // if the username changed make sure it's not used by somebody else
    if (!user.getUsername().equals(dbUser.getUsername())) {
      AppUser testUser = userMongoRepository.findByUsername(user.getUsername());
      if (testUser != null) {
        throw new BadRequestException("Username already in use.");
      }
    }
    if (appUserInputDto.getPassword() == null) {
      user.setPassword(dbUser.getPassword());
    }
    userMongoRepository.save(user);
    return user;
  }

  @Override
  public void deleteUser(String userId) {
    removeUserFromUserGroups(userId);
    userMongoRepository.deleteById(userId);
  }

  @Override
  public List<AppUser> findByRoleName(String roleName) {
    return userMongoRepository.findByRole(roleName);
  }

  /**
   * Authenticates a user's credentials stored in either the local user database or in an external
   * LDAP server
   *
   * @param loginInput The credentials of the user that are to be validated.
   * @return The LoginOutputDTO including a newly created session token.
   */
  @Override
  public LoginOutputDto loginUser(LoginInputDto loginInput) {
    AppUser appUser;
    // login user using credentials stored in LDAP
    if (ldapEnabled) {
      // if ldap credentials are valid
      if (ldapClient.authUserInLdap(loginInput)) {
        appUser = userMongoRepository.findByUsername(loginInput.getUsername());
        // add ldap user into local db if it doesnt exist already
        if (appUser == null) {
          appUser = new AppUser();
          appUser.setUsername(loginInput.getUsername());
          appUser.setLdapUser(true);
          // do not need to store LDAP passwords in the local user database
          appUser.setPassword(null);
          appUser.setSettings(Constants.getDefaultUserSettings());
          if (userMongoRepository.findByUsername(appUser.getUsername()) != null) {
            throw new UserExistsException(
                "User with username \"" + appUser.getUsername() + "\" already exists.");
          }
        }
        // define user role by checking LDAP groups
        if (!ldapClient.searchUserRole(loginInput.getUsername(), "CPT_ADMIN")) {
          // if not admin user, then check if user has read-write access
          if (!ldapClient.searchUserRole(loginInput.getUsername(), "CPT_READ_WRITE")) {
            // if neither admin nor R/W role, check against read-only role
            if (ldapClient.searchUserRole(loginInput.getUsername(), "CPT_READ_ONLY")) {
              appUser.setRole(Role.READ_ONLY);
            } else {
              throw new UnauthorizedException("User is not authorized to access the tool.");
            }
          } else {
            appUser.setRole(Role.READ_AND_WRITE);
          }
        } else {
          // set the user role as admin in db
          appUser.setRole(Role.ADMIN);
        }
        userMongoRepository.save(appUser);
        // create the session
        Session userSession = createSession(appUser.getUsername());

        LoginOutputDto loginOutputDto = new LoginOutputDto();
        loginOutputDto.setUserId(appUser.getId());
        loginOutputDto.setToken(userSession.getId());

        return loginOutputDto;
      }
      // Could not find user in LDAP server
      throw new UnauthorizedException("Authentication Failed.");
    } else {
      // login user using credentials stored in local db
      appUser = userMongoRepository.findByUsername(loginInput.getUsername());
      if (appUser != null) {
        BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
        if (passwordEncoder.matches(loginInput.getPassword(), appUser.getPassword())) {
          Session userSession = createSession(appUser.getUsername());

          LoginOutputDto loginOutputDto = new LoginOutputDto();
          loginOutputDto.setToken(userSession.getId());
          loginOutputDto.setUserId(appUser.getId());

          return loginOutputDto;
        }
        throw new UnauthorizedException("Incorrect password.");
      }
      throw new UnauthorizedException("User not found.");
    }
  }

  @Override
  public AppUser getUserByName(String username) {
    return userMongoRepository.findByUsername(username);
  }

  @Override
  public Map<String, Object> getSettingsForUser(String userId) {
    AppUser user = userMongoRepository.findById(userId).get();
    if (user == null) {
      throw new UserNotFoundException("User with ID \"" + userId + "\" not found.");
    }
    Map<String, Object> settings = user.getSettings();
    if (settings == null) {
      settings = Collections.emptyMap();
    }
    return settings;
  }

  @Override
  public void addSettingToUser(String userId, SettingDto settingDto) {
    AppUser user = userMongoRepository.findById(userId).get();
    if (user == null) {
      throw new UserNotFoundException("User with ID \"" + userId + "\" not found.");
    }
    Map<String, Object> settings = user.getSettings();
    if (settings == null) {
      settings = new HashMap<>();
    }
    if (settingDto == null) {
      throw new BadRequestException("Invalid or missing body in request.");
    }
    if (StringUtils.isBlank(settingDto.getKey())) {
      throw new BadRequestException("Invalid key for setting.");
    }
    settings.put(settingDto.getKey(), settingDto.getValue());
    user.setSettings(settings);
    userMongoRepository.save(user);
  }

  private void removeUserFromUserGroups(String userId) {
    List<UserGroup> userGroups = userGroupService.getUserGroupsForUser(userId);
    for (UserGroup userGroup : userGroups) {
      if (userGroup.getUsers() != null && userGroup.getUsers().contains(userId)) {
        userGroup.getUsers().remove(userId);
        userGroupService.updateUserGroup(userGroup);
      }
    }
  }

  /**
   * Generates a Session linked to a specified username and stores it in the common backend
   * repository. The session's id is used as the authorization token to authorize Rest Requests to
   * both the forecast Backend and Model Backend
   *
   * @param username the username to be associated with the session
   * @return the newly created session object
   */
  private Session createSession(String username) {
    Session userSession = new Session();
    userSession.setUsername(username);
    userSession.setIssueTime(LocalDateTime.now());
    // This method uses SecureRandom internally.
    userSession.setId(UUID.randomUUID().toString());
    userSession = sessionRepository.save(userSession);
    return userSession;
  }

  private void validateAppUser(AppUser appUser) {
    if (StringUtils.isBlank(appUser.getUsername())) {
      throw new BadRequestException("Username cannot be blank or omitted.");
    }
    if (appUser.getRole() == null) {
      throw new BadRequestException("Role cannot be omitted.");
    }
    if (appUser.getSettings() != null) {
      for (String settingKey : appUser.getSettings().keySet()) {
        if (StringUtils.isBlank(settingKey)) {
          throw new BadRequestException("Key for setting cannot be blank.");
        }
      }
    }
  }
}
