from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build

from ..config import settings

# Only what we told Google about on the OAuth consent screen: read the
# inbox, and manage/send drafts (used later for the explicit user-approved
# send action, never automatically).
SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.compose",
]


# Holds the in-progress Flow object (and its PKCE code_verifier) between
# /auth/login and /auth/callback, keyed by the random `state` value Google
# round-trips back to us. Fine for a single-process dev server; a
# multi-process deployment would need this shared somewhere durable instead.
_pending_flows: dict[str, tuple[Flow, bool]] = {}


def _build_flow() -> Flow:
    client_config = {
        "web": {
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [settings.google_redirect_uri],
        }
    }
    flow = Flow.from_client_config(client_config, scopes=SCOPES)
    flow.redirect_uri = settings.google_redirect_uri
    return flow


def build_login_url(native: bool = False) -> str:
    flow = _build_flow()
    auth_url, state = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
    )
    _pending_flows[state] = (flow, native)
    return auth_url


def exchange_code_for_tokens(state: str, code: str) -> tuple[Credentials, bool]:
    pending = _pending_flows.pop(state, None)
    if pending is None:
        raise ValueError(
            "No matching login attempt found for this state (it may have "
            "expired, or the server restarted mid-login). Start over at "
            "/auth/login."
        )
    flow, native = pending
    flow.fetch_token(code=code)
    return flow.credentials, native


def get_profile_email(credentials: Credentials) -> str:
    service = build("gmail", "v1", credentials=credentials)
    profile = service.users().getProfile(userId="me").execute()
    return profile["emailAddress"]
