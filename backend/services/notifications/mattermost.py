from backend.services.notifications.base import WebhookSender
from backend.services.utils.config import Config


class MattermostWebhookSender(WebhookSender):
    def __init__(self, url: str):
        super().__init__(url)

    async def send_text(self, event_data: dict):
        event_url = "http://localhost:5175/issues"
        payload = {
            "text": "",
            "attachments": [{
                "title": f"🚨 {event_data.get('exception_type', 'Новая ошибка')}",
                "text": f"### Описание\n{event_data.get('exception_message', 'Без описания')}\n\n" +
                        "### Детали\n" +
                        f"- **Время:** {event_data.get('timestamp').strftime('%d.%m.%Y %H:%M:%S')}\n" +
                        f"- **Файл:** {event_data.get('path', 'N/A')}:{event_data.get('line', 'N/A')}\n" +
                        f"- **Сервер:** {event_data.get('server_name', 'N/A')}\n\n" +
                        f"[Просмотреть ошибку]({event_url})",
                "color": "#FF0000" if event_data.get('severity') == 'high' else
                "#FFA500" if event_data.get('severity') == 'medium' else "#00FF00",
                "footer": f"Severity: {event_data.get('severity', 'unknown').upper()}",
                "footer_icon": "https://mattermost.com/wp-content/uploads/2022/02/icon.png"
            }]
        }
        await self.send(payload)
