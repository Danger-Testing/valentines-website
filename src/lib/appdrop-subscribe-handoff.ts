export type AppdropFollowHandoffOptions = {
  contact: string;
  creator: string;
  method: "email";
  source: string;
};

export type AppdropFollowApi = {
  buildUrl?: (options: AppdropFollowHandoffOptions) => URL;
  handoff?: (options: AppdropFollowHandoffOptions) => URL | void;
};

type SubscribeResult = {
  ok: boolean;
};

type SubscribeThenHandoffOptions = {
  assign: (url: string) => void;
  email: string;
  follow: AppdropFollowApi | undefined;
  subscribe: () => Promise<SubscribeResult>;
};

export function handoffToAppdrop(
  email: string,
  follow: AppdropFollowApi | undefined,
  assign: (url: string) => void,
) {
  const options: AppdropFollowHandoffOptions = {
    contact: email,
    creator: "marcgmbh",
    method: "email",
    source: "linkbouquet",
  };

  if (follow?.handoff) {
    follow.handoff(options);
    return;
  }

  if (follow?.buildUrl) {
    assign(follow.buildUrl(options).toString());
    return;
  }

  throw new Error("Appdrop follow behavior is unavailable.");
}

export async function subscribeThenHandoff({
  assign,
  email,
  follow,
  subscribe,
}: SubscribeThenHandoffOptions) {
  const response = await subscribe();
  if (!response.ok) return false;

  handoffToAppdrop(email, follow, assign);
  return true;
}
