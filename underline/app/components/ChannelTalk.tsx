import { useEffect } from 'react';
import { Headset } from 'lucide-react';

declare global {
    interface Window {
        ChannelIO?: any;
        ChannelIOInitialized?: boolean;
    }
}

interface ChannelTalkProps {
    pluginKey: string;
    memberId?: string;
    profile?: {
        name?: string;
        mobileNumber?: string;
        email?: string;
        [key: string]: any;
    };
}

export function ChannelTalk({ pluginKey, memberId, profile }: ChannelTalkProps) {
    useEffect(() => {
        if (!pluginKey) return;

        const w = window as any;
        if (w.ChannelIO) {
            boot();
        } else {
            const ch = function () {
                ch.c(arguments);
            };
            ch.q = [] as any[];
            ch.c = function (args: any) {
                ch.q.push(args);
            };
            w.ChannelIO = ch;

            const s = document.createElement('script');
            s.type = 'text/javascript';
            s.async = true;
            s.src = 'https://cdn.channel.io/plugin/ch-plugin-web.js';
            s.charset = 'UTF-8';
            const x = document.getElementsByTagName('script')[0];
            if (x.parentNode) {
                x.parentNode.insertBefore(s, x);
            }

            s.onload = () => {
                boot();
            };
        }

        function boot() {
            if (window.ChannelIO) {
                window.ChannelIO('boot', {
                    pluginKey: pluginKey,
                    memberId: memberId,
                    profile: profile,
                    hideChannelButtonOnBoot: true, // Hide default button
                });
            }
        }

        return () => {
            if (window.ChannelIO) {
                window.ChannelIO('shutdown');
            }
        };
    }, [pluginKey, memberId, profile]);

    const openChannelTalk = () => {
        if (window.ChannelIO) {
            window.ChannelIO('showMessenger');
        }
    };

    return (
        <button
            onClick={openChannelTalk}
            className="fixed bottom-[120px] right-5 z-50 w-14 h-14 bg-[var(--primary)] rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
            aria-label="채널톡 문의하기"
        >
            <Headset className="w-6 h-6 text-white" />
        </button>
    );
}
