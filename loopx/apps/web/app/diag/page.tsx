'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface LogItem {
  id: string;
  time: string;
  type: 'info' | 'success' | 'warn' | 'error' | 'sent' | 'received';
  text: string;
}

export default function DiagPage() {
  const [role, setRole] = useState<'A' | 'B'>('A');
  const [isRunning, setIsRunning] = useState(false);
  const [connStatus, setConnStatus] = useState<string>('disconnected');
  const [userId, setUserId] = useState<string>('');
  const [hasJoined, setHasJoined] = useState<boolean | null>(null);
  const [memberCount, setMemberCount] = useState<number>(0);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [customMsg, setCustomMsg] = useState('');
  const [autoPing, setAutoPing] = useState(true);

  const logsEndRef = useRef<HTMLDivElement>(null);
  const autoPingIntervalRef = useRef<any>(null);
  const cometChatRef = useRef<any>(null);

  const GUID = 'loopx-diag-room';

  const addLog = (type: LogItem['type'], text: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { id: `${Date.now()}_${Math.random()}`, time, type, text }]);
  };

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Read URL query params (?role=A or ?role=B)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const r = params.get('role');
      if (r === 'B' || r === 'b') {
        setRole('B');
      } else {
        setRole('A');
      }
    }
  }, []);

  async function startDiagnostic(selectedRole: 'A' | 'B') {
    setIsRunning(true);
    setLogs([]);
    addLog('info', `Starting CometChat Cross-Browser Diagnostic as Role [${selectedRole}]...`);

    try {
      const { getSDK } = await import('@repo/cometchat-client');
      const CometChat = await getSDK();
      cometChatRef.current = CometChat;

      const APP_ID = process.env.NEXT_PUBLIC_COMETCHAT_APP_ID || '1684134e6dc619c7d';
      const REGION = process.env.NEXT_PUBLIC_COMETCHAT_REGION || 'in';
      const AUTH_KEY = process.env.NEXT_PUBLIC_COMETCHAT_AUTH_KEY || '0bf9c5ebc34fa55c1d2c5c1596c87bd021b62f7e';

      const shortCode = Math.random().toString(36).slice(2, 6).toUpperCase();
      const uid = `diag_${selectedRole.toLowerCase()}_${shortCode}`;
      setUserId(uid);

      addLog('info', `Initializing SDK: AppID=${APP_ID.slice(0, 6)}... Region=${REGION}`);

      const appSettings = new CometChat.AppSettingsBuilder()
        .setRegion(REGION)
        .autoEstablishSocketConnection(true)
        .build();

      await CometChat.init(APP_ID, appSettings);
      addLog('success', 'CometChat SDK initialized successfully.');

      // Connection listener
      try {
        CometChat.removeConnectionListener('diag_conn');
      } catch (_) {}

      CometChat.addConnectionListener(
        'diag_conn',
        new CometChat.ConnectionListener({
          inConnecting: () => {
            setConnStatus('connecting');
            addLog('info', '🔌 WebSocket: CONNECTING...');
          },
          onConnected: () => {
            setConnStatus('connected');
            addLog('success', '🟢 WebSocket: CONNECTED ✓ (Socket established with CometChat)');
          },
          onDisconnected: () => {
            setConnStatus('disconnected');
            addLog('warn', '🔴 WebSocket: DISCONNECTED ✗');
          },
          onFeatureThrottled: () => addLog('warn', '⚠️ WebSocket: THROTTLED'),
          onConnectionError: (e: any) => addLog('error', `⚠️ WebSocket ERROR: ${e?.message || JSON.stringify(e)}`),
        })
      );

      // Logout previous user session if exists
      try {
        const currentUser = await CometChat.getLoggedinUser();
        if (currentUser) {
          addLog('info', `Logging out previous active user: ${currentUser.getUid()}...`);
          await CometChat.logout();
        }
      } catch (_) {}

      // Create user or skip if exists
      try {
        const u = new CometChat.User(uid);
        u.setName(`Diag User ${selectedRole} ${shortCode}`);
        await CometChat.createUser(u, AUTH_KEY);
        addLog('success', `User created: ${uid}`);
      } catch (e: any) {
        if (e?.code === 'ERR_UID_ALREADY_EXISTS') {
          addLog('info', `User already exists: ${uid}`);
        } else {
          addLog('error', `createUser failed: code=${e?.code} message=${e?.message} details=${JSON.stringify(e?.details || e)}`);
        }
      }

      // Login
      let me: any;
      try {
        me = await CometChat.login(uid, AUTH_KEY);
        addLog('success', `Logged in as: ${me.getUid()} (${me.getName()})`);
      } catch (e: any) {
        addLog('error', `login failed: code=${e?.code} message=${e?.message} details=${JSON.stringify(e?.details || e)}`);
        setIsRunning(false);
        return;
      }

      // Group handling
      if (selectedRole === 'A') {
        try {
          const group = new CometChat.Group(GUID, 'Cross-Browser Diag Group', CometChat.GROUP_TYPE.PUBLIC, '');
          await CometChat.createGroup(group);
          addLog('success', `Created public test group: ${GUID}`);
        } catch (e: any) {
          if (e?.code !== 'ERR_GUID_ALREADY_EXISTS') {
            addLog('info', `Group creation info: ${e?.message || e?.code}`);
          }
        }
      }

      // Join group with retry
      for (let attempt = 1; attempt <= 5; attempt++) {
        try {
          await CometChat.joinGroup(GUID, CometChat.GROUP_TYPE.PUBLIC, '');
          addLog('success', `Joined group: ${GUID}`);
          break;
        } catch (e: any) {
          if (e?.code === 'ERR_ALREADY_JOINED') {
            addLog('info', `Already member of group: ${GUID}`);
            break;
          }
          addLog('warn', `Join attempt ${attempt}/5 failed: ${e?.code || e?.message}. Retrying in 1.5s...`);
          if (attempt === 5) throw e;
          await new Promise((r) => setTimeout(r, 1500));
        }
      }

      // Verify membership
      const g = await CometChat.getGroup(GUID);
      const isJoined = g.getHasJoined();
      const count = g.getMembersCount();
      setHasJoined(isJoined);
      setMemberCount(count);
      addLog(isJoined ? 'success' : 'warn', `Group verification: hasJoined=${isJoined}, members=${count}`);

      // Message Listener
      try {
        CometChat.removeMessageListener('diag_msg');
      } catch (_) {}

      CometChat.addMessageListener(
        'diag_msg',
        new CometChat.MessageListener({
          onTextMessageReceived: (m: any) => {
            const sender = m.getSender()?.getUid() || 'unknown';
            const text = m.getText() || '';
            addLog('received', `📩 RECEIVED from [${sender}]: "${text}"`);
          },
          onMediaMessageReceived: (m: any) => {
            addLog('received', `📩 RECEIVED media from [${m.getSender()?.getUid()}]`);
          },
          onCustomMessageReceived: (m: any) => {
            addLog('received', `📩 RECEIVED custom message: ${JSON.stringify(m.getCustomData())}`);
          },
        })
      );
      addLog('success', 'Message listener registered: diag_msg');

      const initialStatus = CometChat.getConnectionStatus();
      setConnStatus(initialStatus);
      addLog('info', `Current SDK socket status: ${initialStatus}`);

      // Start auto ping
      if (autoPingIntervalRef.current) clearInterval(autoPingIntervalRef.current);
      autoPingIntervalRef.current = setInterval(async () => {
        try {
          const pingText = `Ping from ${selectedRole} [${shortCode}] @ ${new Date().toLocaleTimeString()}`;
          const msg = new CometChat.TextMessage(GUID, pingText, CometChat.RECEIVER_TYPE.GROUP);
          const sent = await CometChat.sendMessage(msg);
          addLog('sent', `📤 SENT id:${sent.getId()} -> "${pingText}"`);
        } catch (err: any) {
          addLog('error', `Send failed: ${err?.message || err?.code}`);
        }
      }, 5000);
    } catch (err: any) {
      addLog('error', `Fatal diagnostic error: ${err?.message || JSON.stringify(err)}`);
    }
  }

  async function sendManualMessage() {
    if (!customMsg.trim() || !cometChatRef.current) return;
    try {
      const CometChat = cometChatRef.current;
      const text = customMsg.trim();
      const msg = new CometChat.TextMessage(GUID, text, CometChat.RECEIVER_TYPE.GROUP);
      const sent = await CometChat.sendMessage(msg);
      addLog('sent', `📤 SENT manual msg id:${sent.getId()} -> "${text}"`);
      setCustomMsg('');
    } catch (err: any) {
      addLog('error', `Send failed: ${err?.message || err?.code}`);
    }
  }

  useEffect(() => {
    return () => {
      if (autoPingIntervalRef.current) {
        clearInterval(autoPingIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6 font-mono text-xs flex flex-col">
      {/* Header */}
      <div className="max-w-4xl w-full mx-auto flex items-center justify-between pb-4 border-b border-neutral-800">
        <div>
          <h1 className="text-base font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            CometChat Cross-Browser Diagnostic Tool
          </h1>
          <p className="text-neutral-400 text-[11px] mt-0.5">
            Test real-time WebSocket group chat between Brave & Chrome with zero middleware.
          </p>
        </div>
        <Link
          href="/app"
          className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
        >
          ← Back to Workspace
        </Link>
      </div>

      {/* Control Bar */}
      <div className="max-w-4xl w-full mx-auto my-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Role Picker */}
        <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl flex flex-col gap-2">
          <span className="text-neutral-400 font-semibold uppercase text-[10px]">Select Role</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setRole('A');
                if (typeof window !== 'undefined') window.history.replaceState(null, '', '?role=A');
              }}
              className={`py-1.5 px-3 rounded-lg font-bold text-center transition-all ${
                role === 'A' ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' : 'bg-neutral-800 text-neutral-400'
              }`}
            >
              Role A (Chrome)
            </button>
            <button
              onClick={() => {
                setRole('B');
                if (typeof window !== 'undefined') window.history.replaceState(null, '', '?role=B');
              }}
              className={`py-1.5 px-3 rounded-lg font-bold text-center transition-all ${
                role === 'B' ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20' : 'bg-neutral-800 text-neutral-400'
              }`}
            >
              Role B (Brave)
            </button>
          </div>
        </div>

        {/* Socket Status */}
        <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl flex flex-col justify-between">
          <span className="text-neutral-400 font-semibold uppercase text-[10px]">Socket Status</span>
          <div className="flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full ${
                connStatus === 'connected'
                  ? 'bg-emerald-400 shadow-md shadow-emerald-400/50 animate-pulse'
                  : connStatus === 'connecting'
                    ? 'bg-amber-400 animate-ping'
                    : 'bg-red-500'
              }`}
            />
            <span className="font-bold text-sm uppercase text-white">{connStatus}</span>
          </div>
        </div>

        {/* User & Group Info */}
        <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl flex flex-col justify-between">
          <span className="text-neutral-400 font-semibold uppercase text-[10px]">Group Membership</span>
          <div>
            <div className="text-white font-bold truncate">UID: {userId || 'Not started'}</div>
            <div className="text-[10px] text-neutral-400">
              Joined: <span className={hasJoined ? 'text-emerald-400 font-bold' : 'text-neutral-500'}>{String(hasJoined)}</span> | Members: {memberCount}
            </div>
          </div>
        </div>

        {/* Start Button */}
        <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl flex flex-col justify-center">
          <button
            onClick={() => startDiagnostic(role)}
            disabled={isRunning}
            className={`w-full py-2 px-4 rounded-lg font-bold transition-all ${
              isRunning
                ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/20'
            }`}
          >
            {isRunning ? 'Diagnostic Running...' : `Start Test as Role ${role}`}
          </button>
        </div>
      </div>

      {/* Manual Input Bar */}
      {isRunning && (
        <div className="max-w-4xl w-full mx-auto mb-3 flex gap-2">
          <input
            type="text"
            value={customMsg}
            onChange={(e) => setCustomMsg(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendManualMessage()}
            placeholder="Type custom test message and press Enter..."
            className="flex-1 px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-cyan-400"
          />
          <button
            onClick={sendManualMessage}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-lg transition-colors"
          >
            Send Test
          </button>
        </div>
      )}

      {/* Live Log Stream Console */}
      <div className="max-w-4xl w-full mx-auto flex-1 bg-neutral-900/90 border border-neutral-800 rounded-xl p-4 overflow-y-auto flex flex-col gap-1 min-h-[350px]">
        <div className="text-neutral-500 pb-2 border-b border-neutral-800/80 mb-2 flex items-center justify-between">
          <span>EVENT LOG CONSOLE</span>
          <span>{logs.length} events</span>
        </div>

        {logs.length === 0 ? (
          <div className="text-neutral-600 my-auto text-center py-12">
            Click &quot;Start Test as Role {role}&quot; above to connect to CometChat and stream live WebSocket packets.
          </div>
        ) : (
          logs.map((log) => {
            let color = 'text-neutral-300';
            if (log.type === 'success') color = 'text-emerald-400';
            if (log.type === 'sent') color = 'text-cyan-400';
            if (log.type === 'received') color = 'text-amber-300 font-bold bg-amber-400/10 px-1 py-0.5 rounded';
            if (log.type === 'warn') color = 'text-amber-400';
            if (log.type === 'error') color = 'text-red-400 font-bold';

            return (
              <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                <span className="text-neutral-500 select-none">[{log.time}]</span>
                <span className={color}>{log.text}</span>
              </div>
            );
          })
        )}
        <div ref={logsEndRef} />
      </div>

      {/* Instructions footer */}
      <div className="max-w-4xl w-full mx-auto mt-3 text-[11px] text-neutral-400 border-t border-neutral-800/80 pt-3">
        <p className="font-semibold text-neutral-300 mb-1">How to test across Brave and Chrome:</p>
        <ol className="list-decimal list-inside space-y-0.5 text-neutral-400">
          <li>Open this page in Google Chrome: <code className="text-cyan-400">http://localhost:3000/diag?role=A</code> and click &quot;Start Test&quot;.</li>
          <li>Open this page in Brave: <code className="text-amber-400">http://localhost:3000/diag?role=B</code> (Ensure Brave Shields = OFF) and click &quot;Start Test&quot;.</li>
          <li>Every 5s, Role A will ping Role B and vice versa. You will see amber <code className="text-amber-300 font-bold">📩 RECEIVED</code> entries live on both screens!</li>
        </ol>
      </div>
    </div>
  );
}
