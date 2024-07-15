import axios from "axios";
import basicToken from "./Tokens.js";
import Endpoints from "./Endpoints.js";
import type { lightSwitchInfo, fortniteBuild, authToken } from "./types";

export default async function GetVersion(): Promise<string> {
  const Auth = (
    await axios.post<authToken>(
      Endpoints.OAUTH_TOKEN_CREATE,
      "grant_type=client_credentials",
      {
        headers: {
          Authorization: "Basic " + basicToken.LAUNCHER_WINDOWS,
        },
      }
    )
  ).data;

  const ClientToken = Auth.access_token;

  const LightSwitchInfo = (
    await axios.get<lightSwitchInfo>(
      "https://lightswitch-public-service-prod.ol.epicgames.com/lightswitch/api/service/Fortnite/status",
      {
        headers: { Authorization: `Bearer ${ClientToken}` },
      }
    )
  ).data;

  const CatalogItem = (
    await axios.get<fortniteBuild>(
      `https://launcher-public-service-prod06.ol.epicgames.com/launcher/api/public/assets/v2/platform/Windows/namespace/${LightSwitchInfo.launcherInfoDTO.namespace}/catalogItem/${LightSwitchInfo.launcherInfoDTO.catalogItemId}/app/Fortnite/label/Live`,
      {
        headers: { Authorization: `Bearer ${ClientToken}` },
      }
    )
  ).data.elements[0];

  await axios.delete(`${Endpoints.OAUTH_TOKEN_KILL}/${ClientToken}`, {
    headers: { Authorization: `Bearer ${ClientToken}` },
  });

  return CatalogItem.buildVersion;
}
