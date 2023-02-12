import { OrganisationMember } from "@mongoose/schemas/OrganisationMember";
import OrganisationPermissionChecker from "@shared/permissionCheckers/organisationPermissionChecker";

export default class OrganisationPermissionCheckerBE extends OrganisationPermissionChecker {
  public static async from(organisationId: any) {
    const members = await OrganisationMember.find(
      {
        organisation: organisationId,
      },
      "role",
    ).populate([
      {
        path: "user",
        select: "email",
      },
    ]);

    return new OrganisationPermissionChecker(members);
  }
}
