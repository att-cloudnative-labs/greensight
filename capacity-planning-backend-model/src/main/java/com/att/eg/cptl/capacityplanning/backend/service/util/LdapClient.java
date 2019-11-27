package com.att.eg.cptl.capacityplanning.backend.service.util;

import com.att.eg.cptl.capacityplanning.backend.dto.LoginInputDto;
import com.att.eg.cptl.capacityplanning.backend.model.AppUser;
import java.util.List;
import javax.naming.NamingException;
import javax.naming.directory.Attributes;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.ldap.core.AttributesMapper;
import org.springframework.ldap.core.LdapTemplate;
import org.springframework.ldap.filter.AndFilter;
import org.springframework.ldap.filter.EqualsFilter;
import org.springframework.ldap.query.LdapQuery;
import org.springframework.ldap.query.SearchScope;
import org.springframework.ldap.support.LdapUtils;
import org.springframework.stereotype.Service;

@Service
/** A service responsible for handle any interactions with the external LDAP server */
public class LdapClient {

  @Autowired private LdapTemplate ldapTemplate;
  @Autowired Environment env;
  private static final Integer THREE_SECONDS = 3000;

  // add user in the list if it is member of the role
  List<AppUser> appUser;

  // list of roles from property file
  String[] individualRole;

  /**
   * Authenticates a user's credentials by checking an external LDAP server.
   *
   * @param loginInputDto an object containing the credentials of an LDAP user to be validated
   * @return true if the credentials match those of a user stored in the LDAP server, false
   *     otherwise
   */
  public boolean authUserInLdap(LoginInputDto loginInputDto) {
    AndFilter filter = new AndFilter();
    filter.and(new EqualsFilter("cn", loginInputDto.getUsername()));
    return ldapTemplate.authenticate("", filter.encode(), loginInputDto.getPassword());
  }

  /**
   * A function to search the authenticated user in LDAP mapped roles
   *
   * @param user username of the authenticated user to be searched in roles
   * @param roleName name of CPT role to retrieve mapped LDAP roles from property file
   * @return true if authenticated user exists in any of the LDAP roles, otherwise it returns false
   *     if user doesn't belong to any role
   */
  public boolean searchUserRole(String user, String roleName) {
    boolean userExistsInRole = false;
    // get list of ldap roles
    String listOfRoles = env.getProperty(roleName);
    // separate roles and add them in a array of string
    individualRole = listOfRoles.split("-");
    LdapQuery query = null;
    // for each role search user's membership
    for (String role : individualRole) {
      // retrieve role name (definedRole[0]) and search path(definedRole[1])
      // and replace them in the ldap search string
      String[] definedRole = role.split(":");
      if (definedRole.length == 2) {
        query =
            org.springframework.ldap.query.LdapQueryBuilder.query()
                .searchScope(SearchScope.SUBTREE)
                .timeLimit(THREE_SECONDS)
                .countLimit(10)
                .attributes("cn")
                .base(LdapUtils.emptyLdapName())
                .where("sAmaccountname")
                .like(user)
                .and("memberof")
                .is("CN=" + definedRole[0] + "," + definedRole[1] + ",DC=ds,DC=dtveng,DC=net")
                .and("uid")
                .isPresent();
        appUser = ldapTemplate.search(query, new UserAttributesMapper());
        // if user found in the role break out of the loop otherwise keep searching
        if (appUser.isEmpty()) {
          continue;
        } else {
          userExistsInRole = true;
          break;
        }
      }
    }
    return userExistsInRole;
  }

  /** Custom user attributes mapper, maps the attributes to the user POJO */
  private class UserAttributesMapper implements AttributesMapper<AppUser> {
    public AppUser mapFromAttributes(Attributes attrs) throws NamingException {
      AppUser user = new AppUser();
      user.setUsername((String) attrs.get("cn").get());
      return user;
    }
  }
}
