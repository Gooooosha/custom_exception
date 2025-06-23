from backend.services.notifications.base import WebhookSender


class SlackWebhookSender(WebhookSender):
    def __init__(self, url: str):
        super().__init__(url)

    async def send_text(self, text: str):
        payload = {"text": text}
        await self.send(payload)

    async def send_blocks(self, blocks: list, text_fallback: str = ""):
        payload = {
            "text": text_fallback,
            "blocks": blocks
        }
        await self.send(payload)

    async def send_attachment(self, text: str, attachments: list):
        payload = {
            "text": text,
            "attachments": attachments
        }
        await self.send(payload)
