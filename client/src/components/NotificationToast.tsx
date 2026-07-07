import { useAppContext } from "../context/AppContext";

export default function NotificationToast() {
	const { notification } = useAppContext();

	if (!notification) return null;

	return (
		<div className="fixed bottom-inset-lg right-inset-lg z-50 max-w-xs rounded-surface bg-surface-inverse px-inset-md py-inset-sm shadow-lg">
			<p className="text-button-md text-on-inverse">{notification}</p>
		</div>
	);
}
