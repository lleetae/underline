import { toast } from "sonner";

export const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
        // 1. Try modern API
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
            return true;
        }
        throw new Error('Clipboard API not available');
    } catch (err) {
        // 2. Fallback to execCommand with iOS support
        try {
            const textArea = document.createElement("textarea");
            textArea.value = text;

            // iOS-safe styling
            textArea.style.position = "fixed";
            textArea.style.left = "0";
            textArea.style.top = "0";
            textArea.style.opacity = "0";
            textArea.style.pointerEvents = "none";
            textArea.setAttribute('readonly', '');
            textArea.contentEditable = 'true'; // iOS requires this for some reason

            document.body.appendChild(textArea);

            // iOS-specific selection
            const range = document.createRange();
            range.selectNodeContents(textArea);
            const selection = window.getSelection();
            if (selection) {
                selection.removeAllRanges();
                selection.addRange(range);
            }

            textArea.setSelectionRange(0, 999999); // For mobile devices

            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);

            if (successful) {
                return true;
            }
            throw new Error('execCommand failed');
        } catch (fallbackErr) {
            console.error('Copy failed:', fallbackErr);
            return false;
        }
    }
};

export const handleCopy = async (text: string, successMessage: string = '복사되었습니다!') => {
    const success = await copyToClipboard(text);
    if (success) {
        toast.success(successMessage);
    } else {
        toast.error('복사에 실패했습니다. 다시 시도해주세요.');
    }
};
