import aiohttp


class WebhookSender:
    def __init__(self, url: str, headers: dict = None, method: str = "POST"):
        self.url = url
        self.headers = headers or {"Content-Type": "application/json"}
        self.method = method.upper()

    async def send(self, payload: dict, timeout: int = 5) -> aiohttp.ClientResponse:
        async with aiohttp.ClientSession() as db_session:
            try:
                async with db_session.request(
                        method=self.method,
                        url=self.url,
                        json=payload,
                        headers=self.headers,
                        timeout=timeout
                ) as response:
                    response.raise_for_status()
                    return response
            except aiohttp.ClientError as e:
                print(f"Error sending webhook: {e}")
                raise
