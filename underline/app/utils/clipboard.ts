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
        // 2. Fallback to execCommand
        try {
            const textArea = document.createElement("textarea");
            textArea.value = text;

            // Ensure it's not visible but part of the DOM
            textArea.style.position = "fixed";
            textArea.style.left = "-9999px";
            textArea.style.top = "0";
            document.body.appendChild(textArea);

            textArea.focus();
            textArea.select();

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
