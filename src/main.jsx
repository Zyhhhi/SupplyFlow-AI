import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CalendarClock,
  Check,
  ClipboardList,
  Clipboard,
  Database,
  History,
  FileText,
  FileWarning,
  Lightbulb,
  MessageSquareText,
  PackageSearch,
  ShieldCheck,
  Sparkles,
  Truck,
  Trash2,
} from "lucide-react";
import { appConfig } from "./config";
import { mockCases } from "./mock/cases";
import { fallbackAiResult, mockAiResults } from "./mock/aiResults";
import "./styles.css";

const statusClass = {
  高: "danger",
  中高: "warning",
  中: "notice",
  低: "success",
};

const HISTORY_STORAGE_KEY = "supplyflow-ai-history";
const FEEDBACK_STORAGE_KEY = "supplyflow-ai-feedback";

function readStorage(key, fallbackValue) {
  try {
    const rawValue = window.localStorage.getItem(key);
    return rawValue ? JSON.parse(rawValue) : fallbackValue;
  } catch {
    return fallbackValue;
  }
}

function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    return;
  }
}

function formatTime(value) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function createReportText(result) {
  return [
    `异常类型：${result.diagnosis.abnormalType}`,
    `风险等级：${result.diagnosis.riskLevel}`,
    `影响范围：${result.diagnosis.impactScope}`,
    `涉及系统：${result.diagnosis.systems.join(" / ")}`,
    "",
    "可能原因：",
    ...result.diagnosis.possibleReasons.map((item) => `- ${item}`),
    "",
    "推荐方案：",
    ...result.recommendations.map((item) => `- ${item.title}，推荐指数 ${item.score}`),
    "",
    "内部同步摘要：",
    result.messages.sales,
    "",
    "客户解释话术：",
    result.messages.customer,
    "",
    "提示：AI 结果仅供参考，关键决策需人工确认。",
  ].join("\n");
}

function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function MetricCard({ icon: Icon, label, value, tone = "neutral" }) {
  return (
    <div className={`metric-card ${tone}`}>
      <div className="metric-icon">
        <Icon size={18} aria-hidden="true" />
      </div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function DataPanel({ title, eyebrow, icon: Icon, children }) {
  return (
    <section className="data-panel">
      <div className="panel-heading">
        <div>
          <span>{eyebrow}</span>
          <h3>{title}</h3>
        </div>
        <Icon size={20} aria-hidden="true" />
      </div>
      {children}
    </section>
  );
}

function KeyValue({ label, value, tone }) {
  return (
    <div className="kv-row">
      <span>{label}</span>
      <strong className={tone ? `text-${tone}` : undefined}>{value}</strong>
    </div>
  );
}

function BulletList({ items }) {
  return (
    <ul className="bullet-list">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function SectionCard({ title, eyebrow, icon: Icon, children, className = "" }) {
  return (
    <section className={`result-card ${className}`}>
      <div className="panel-heading">
        <div>
          <span>{eyebrow}</span>
          <h3>{title}</h3>
        </div>
        <Icon size={20} aria-hidden="true" />
      </div>
      {children}
    </section>
  );
}

function DiagnosisPanel({ result }) {
  return (
    <SectionCard title="AI 诊断面板" eyebrow="Structured Diagnosis" icon={FileWarning}>
      <div className="diagnosis-grid">
        <KeyValue label="异常类型" value={result.diagnosis.abnormalType} />
        <KeyValue
          label="风险等级"
          value={result.diagnosis.riskLevel}
          tone={statusClass[result.diagnosis.riskLevel] ?? "notice"}
        />
        <KeyValue label="影响范围" value={result.diagnosis.impactScope} />
        <KeyValue label="涉及系统" value={result.diagnosis.systems.join(" / ")} />
        <KeyValue
          label="人工升级"
          value={result.diagnosis.escalationRequired ? "建议升级处理" : "暂不强制升级"}
          tone={result.diagnosis.escalationRequired ? "warning" : "success"}
        />
      </div>
      <div className="sub-block">
        <h4>可能原因</h4>
        <BulletList items={result.diagnosis.possibleReasons} />
      </div>
    </SectionCard>
  );
}

function ImpactAnalysis({ result }) {
  const impacts = [
    ["客户交付", result.impactAnalysis.customer],
    ["仓库作业", result.impactAnalysis.warehouse],
    ["运输排期", result.impactAnalysis.transport],
    ["销售/客服沟通", result.impactAnalysis.service],
  ];

  return (
    <SectionCard title="影响分析" eyebrow="Impact Analysis" icon={PackageSearch}>
      <div className="impact-grid">
        {impacts.map(([label, value]) => (
          <div className="impact-item" key={label}>
            <strong>{label}</strong>
            <p>{value}</p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function RecommendationPanel({ result }) {
  return (
    <SectionCard title="处理方案推荐" eyebrow="Recommendation" icon={Lightbulb}>
      <div className="recommendation-grid">
        {result.recommendations.map((item) => (
          <article className="recommendation-card" key={item.title}>
            <div className="recommendation-head">
              <h4>{item.title}</h4>
              <span>{item.score}</span>
            </div>
            <KeyValue label="适用条件" value={item.condition} />
            <KeyValue label="优点" value={item.benefit} tone="success" />
            <KeyValue label="风险" value={item.risk} tone="warning" />
            <div className="confirm-line">
              <ShieldCheck size={15} aria-hidden="true" />
              {item.humanReview ? "需要人工确认后执行" : "可作为低风险建议"}
            </div>
          </article>
        ))}
      </div>
    </SectionCard>
  );
}

function MessagePanel({ result, onCopy, copiedKey }) {
  const messages = [
    ["给仓库的协同消息", result.messages.warehouse],
    ["给运输团队的排期确认消息", result.messages.transport],
    ["给销售/客服的内部同步摘要", result.messages.sales, "sales"],
    ["给客户的解释话术", result.messages.customer, "customer"],
  ];

  return (
    <SectionCard title="协同话术生成" eyebrow="Collaboration Messages" icon={MessageSquareText}>
      <div className="message-grid">
        {messages.map(([label, value, copyKey]) => (
          <article className="message-card" key={label}>
            <div className="message-head">
              <h4>{label}</h4>
              {copyKey && (
                <button type="button" className="copy-button" onClick={() => onCopy(copyKey, value)}>
                  {copiedKey === copyKey ? <Check size={14} /> : <Clipboard size={14} />}
                  {copiedKey === copyKey ? "已复制" : "复制"}
                </button>
              )}
            </div>
            <p>{value}</p>
          </article>
        ))}
      </div>
    </SectionCard>
  );
}

function FeedbackPanel({ onSubmit, feedbackSaved }) {
  const [rating, setRating] = useState("有帮助");
  const [comment, setComment] = useState("");

  function submitFeedback() {
    onSubmit({ rating, comment: comment.trim() });
    setComment("");
  }

  return (
    <section className="feedback-card">
      <div className="section-title compact">
        <div>
          <span>User Feedback</span>
          <h2>用户反馈</h2>
        </div>
      </div>
      <p className="loop-note">本功能用于模拟 Beta 阶段的用户反馈闭环，真实业务场景中可接入企业数据与权限系统。</p>
      <div className="feedback-options" role="radiogroup" aria-label="AI 输出反馈">
        {["有帮助", "一般", "不准确"].map((option) => (
          <button
            type="button"
            key={option}
            className={rating === option ? "feedback-option selected" : "feedback-option"}
            onClick={() => setRating(option)}
          >
            {option}
          </button>
        ))}
      </div>
      <textarea
        className="feedback-textarea"
        rows="3"
        placeholder="补充一句反馈，例如：方案建议可再区分客户优先级。"
        value={comment}
        onChange={(event) => setComment(event.target.value)}
      />
      <div className="feedback-actions">
        <button type="button" className="secondary-action" onClick={submitFeedback}>
          提交反馈
        </button>
        {feedbackSaved && <span>反馈已记录，用于后续优化</span>}
      </div>
    </section>
  );
}

function AiResults({ result, onFeedbackSubmit, feedbackSaved, onCopy, copiedKey }) {
  return (
    <section className="ai-results" aria-label="AI Copilot 输出">
      <div className="section-title">
        <div>
          <span>AI Copilot Output</span>
          <h2>结构化诊断与处理建议</h2>
        </div>
        <p>基于当前异常和模拟业务数据生成，结果用于辅助判断，不替代人工决策。</p>
      </div>
      <div className="human-confirm-note">
        <ShieldCheck size={18} aria-hidden="true" />
        <span>AI 结果仅供参考，关键决策需人工确认。涉及延期、拆单、跨仓调拨时，请由业务负责人复核。</span>
      </div>
      <div className="result-grid">
        <DiagnosisPanel result={result} />
        <ImpactAnalysis result={result} />
      </div>
      <RecommendationPanel result={result} />
      <div className="report-actions">
        <button type="button" className="secondary-action" onClick={() => onCopy("report", createReportText(result))}>
          {copiedKey === "report" ? <Check size={15} /> : <Clipboard size={15} />}
          {copiedKey === "report" ? "完整报告已复制" : "复制完整诊断报告"}
        </button>
      </div>
      <MessagePanel result={result} onCopy={onCopy} copiedKey={copiedKey} />
      <FeedbackPanel onSubmit={onFeedbackSubmit} feedbackSaved={feedbackSaved} />
    </section>
  );
}

function HistoryPanel({ records, onSelect, onDelete, onClear }) {
  return (
    <section className="history-panel">
      <div className="panel-heading">
        <div>
          <span>History</span>
          <h3>历史记录</h3>
        </div>
        <History size={20} aria-hidden="true" />
      </div>
      <p className="loop-note">本功能用于模拟 Beta 阶段的用户反馈闭环，真实业务场景中可接入企业数据与权限系统。</p>
      {records.length === 0 ? (
        <div className="history-empty">
          <FileText size={18} aria-hidden="true" />
          <span>暂无历史记录。完成一次诊断后会自动保存。</span>
        </div>
      ) : (
        <>
          <div className="history-list">
            {records.map((record) => (
              <article className="history-item" key={record.id}>
                <button type="button" className="history-content" onClick={() => onSelect(record)}>
                  <div>
                    <strong>{record.orderNo}</strong>
                    <span>{record.caseTitle} · {formatTime(record.createdAt)}</span>
                  </div>
                  <div className="history-meta">
                    <span className={`badge ${statusClass[record.riskLevel] ?? "notice"}`}>{record.riskLevel}</span>
                    <p>{record.abnormalType}</p>
                    <small>{record.recommendationSummary}</small>
                  </div>
                </button>
                <button
                  type="button"
                  className="icon-action danger-action"
                  aria-label={`删除 ${record.orderNo} 的历史记录`}
                  onClick={() => onDelete(record.id)}
                >
                  <Trash2 size={15} />
                </button>
              </article>
            ))}
          </div>
          <button type="button" className="clear-history" onClick={onClear}>
            清空全部历史记录
          </button>
        </>
      )}
    </section>
  );
}

function AgentWorkflow() {
  const steps = [
    "订单异常识别 Agent",
    "库存影响分析 Agent",
    "运输排期分析 Agent",
    "处理方案推荐 Agent",
    "协同话术生成 Agent",
    "人工确认",
  ];

  return (
    <section className="workflow-card" aria-label="Agent Workflow">
      <div className="section-title">
        <div>
          <span>Agent Workflow</span>
          <h2>供应链执行工作链路</h2>
        </div>
        <p>第一阶段展示流程结构，后续阶段接入诊断、方案与话术输出。</p>
      </div>
      <div className="workflow-steps">
        {steps.map((step, index) => (
          <React.Fragment key={step}>
            <div className={index === 0 ? "workflow-step active" : "workflow-step"}>
              {index < 5 ? <Sparkles size={16} /> : <ShieldCheck size={16} />}
              <span>{step}</span>
            </div>
            {index < steps.length - 1 && <ArrowRight className="workflow-arrow" size={16} />}
          </React.Fragment>
        ))}
      </div>
    </section>
  );
}

function ModeNotice() {
  return (
    <section className="mode-notice">
      <Sparkles size={18} aria-hidden="true" />
      <div>
        <strong>当前版本默认使用模拟数据，适合产品流程演示。</strong>
        <p>
          AI 模式：{appConfig.aiMode === "mock" ? "Mock 演示模式" : "API 占位模式"}。
          DeepSeek API Key 未写入代码，后续可通过环境变量接入。
        </p>
      </div>
    </section>
  );
}

function App() {
  const [selectedCaseId, setSelectedCaseId] = useState(mockCases[0].id);
  const selectedCase = useMemo(
    () => mockCases.find((item) => item.id === selectedCaseId) ?? mockCases[0],
    [selectedCaseId],
  );
  const [formState, setFormState] = useState(selectedCase.input);
  const [aiResult, setAiResult] = useState(null);
  const [formError, setFormError] = useState("");
  const [historyRecords, setHistoryRecords] = useState(() => readStorage(HISTORY_STORAGE_KEY, []));
  const [feedbackSaved, setFeedbackSaved] = useState(false);
  const [copiedKey, setCopiedKey] = useState("");

  function applyCase(caseItem) {
    setSelectedCaseId(caseItem.id);
    setFormState(caseItem.input);
    setAiResult(null);
    setFormError("");
    setFeedbackSaved(false);
  }

  function updateField(key, value) {
    setFormState((current) => ({ ...current, [key]: value }));
    if (formError) {
      setFormError("");
    }
  }

  function startDiagnosis() {
    const requiredValues = [
      formState.orderNo,
      formState.customerType,
      formState.abnormalDesc,
      formState.warehouse,
      formState.promisedDeliveryTime,
      formState.currentStatus,
    ];

    if (requiredValues.some((value) => !value.trim())) {
      setAiResult(null);
      setFormError("请先补充订单号、客户类型、异常描述、关联仓库、预计交付时间和当前状态，再开始诊断。");
      return;
    }

    setFormError("");
    const nextResult = mockAiResults[selectedCaseId] ?? fallbackAiResult;
    setAiResult(nextResult);
    setFeedbackSaved(false);

    const nextRecord = {
      id: `${Date.now()}-${selectedCaseId}`,
      orderNo: formState.orderNo,
      abnormalType: nextResult.diagnosis.abnormalType,
      riskLevel: nextResult.diagnosis.riskLevel,
      createdAt: new Date().toISOString(),
      recommendationSummary: nextResult.recommendations
        .slice()
        .sort((a, b) => b.score - a.score)[0].title,
      caseId: selectedCaseId,
      caseTitle: selectedCase.title,
      formState,
      result: nextResult,
    };
    const nextRecords = [nextRecord, ...historyRecords].slice(0, 12);
    setHistoryRecords(nextRecords);
    writeStorage(HISTORY_STORAGE_KEY, nextRecords);
  }

  function selectHistory(record) {
    setSelectedCaseId(record.caseId);
    setFormState(record.formState);
    setAiResult(record.result);
    setFormError("");
    setFeedbackSaved(false);
  }

  function deleteHistory(recordId) {
    const nextRecords = historyRecords.filter((record) => record.id !== recordId);
    setHistoryRecords(nextRecords);
    writeStorage(HISTORY_STORAGE_KEY, nextRecords);
  }

  function clearHistory() {
    setHistoryRecords([]);
    writeStorage(HISTORY_STORAGE_KEY, []);
  }

  function submitFeedback(feedback) {
    if (!aiResult) {
      return;
    }
    const feedbackRecords = readStorage(FEEDBACK_STORAGE_KEY, []);
    const nextFeedbackRecords = [
      {
        id: `${Date.now()}-feedback`,
        orderNo: formState.orderNo,
        caseId: selectedCaseId,
        rating: feedback.rating,
        comment: feedback.comment,
        createdAt: new Date().toISOString(),
        abnormalType: aiResult.diagnosis.abnormalType,
      },
      ...feedbackRecords,
    ];
    writeStorage(FEEDBACK_STORAGE_KEY, nextFeedbackRecords);
    setFeedbackSaved(true);
  }

  async function copyText(key, text) {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(""), 1600);
    } catch {
      setCopiedKey("");
    }
  }

  return (
    <main className="app-shell">
      <header className="hero">
        <nav className="topbar" aria-label="产品信息">
          <div className="brand-mark">
            <span>SF</span>
          </div>
          <div>
            <strong>SupplyFlow AI</strong>
            <p>供应链执行 Copilot</p>
          </div>
          <div className="topbar-pills">
            <div className="stage-pill">岗位定制型 Concept MVP</div>
            <div className="mode-pill">Mock 模式</div>
          </div>
        </nav>

        <div className="hero-grid">
          <div>
            <div className="eyebrow">Supply Chain Execution Workbench</div>
            <h1>供应链交付异常处理工作台</h1>
            <p className="hero-copy">辅助业务人员快速诊断订单、库存、仓储、运输异常，并生成处理建议与协同话术。</p>
            <div className="risk-note">
              <AlertTriangle size={18} aria-hidden="true" />
              <span>AI 结果仅供参考，关键交付决策需由业务人员人工确认。</span>
            </div>
          </div>
          <div className="hero-summary" aria-label="当前案例摘要">
            <div className="summary-line">
              <span>当前异常</span>
              <strong>{selectedCase.title}</strong>
            </div>
            <div className="summary-line">
              <span>客户优先级</span>
              <strong>{selectedCase.oms.customerPriority}</strong>
            </div>
            <div className="summary-line">
              <span>风险等级</span>
              <strong className={`badge ${statusClass[selectedCase.tms.delayRisk] ?? "notice"}`}>
                {selectedCase.tms.delayRisk}
              </strong>
            </div>
          </div>
        </div>
      </header>

      <section className="workspace">
        <aside className="side-column">
          <section className="input-panel">
          <div className="section-title compact">
            <div>
              <span>Exception Intake</span>
              <h2>异常输入</h2>
            </div>
          </div>

          <div className="case-buttons" aria-label="示例案例">
            {mockCases.map((caseItem) => (
              <button
                type="button"
                key={caseItem.id}
                className={caseItem.id === selectedCaseId ? "case-button selected" : "case-button"}
                onClick={() => applyCase(caseItem)}
              >
                {caseItem.title}
              </button>
            ))}
          </div>

          <form className="intake-form">
            <Field label="订单号">
              <input
                value={formState.orderNo}
                onChange={(event) => updateField("orderNo", event.target.value)}
              />
            </Field>
            <Field label="客户类型">
              <select
                value={formState.customerType}
                onChange={(event) => updateField("customerType", event.target.value)}
              >
                <option>KA 客户</option>
                <option>直营门店</option>
                <option>渠道客户</option>
                <option>项目型客户</option>
              </select>
            </Field>
            <Field label="异常描述">
              <textarea
                rows="4"
                value={formState.abnormalDesc}
                onChange={(event) => updateField("abnormalDesc", event.target.value)}
              />
            </Field>
            <Field label="关联仓库">
              <input
                value={formState.warehouse}
                onChange={(event) => updateField("warehouse", event.target.value)}
              />
            </Field>
            <Field label="预计交付时间">
              <input
                value={formState.promisedDeliveryTime}
                onChange={(event) => updateField("promisedDeliveryTime", event.target.value)}
              />
            </Field>
            <Field label="当前状态">
              <input
                value={formState.currentStatus}
                onChange={(event) => updateField("currentStatus", event.target.value)}
              />
            </Field>
            {formError && (
              <div className="form-error" role="alert">
                <AlertTriangle size={16} aria-hidden="true" />
                <span>{formError}</span>
              </div>
            )}
            <button className="diagnosis-button" type="button" onClick={startDiagnosis}>
              <Sparkles size={17} aria-hidden="true" />
              开始诊断
            </button>
          </form>
          </section>
          <HistoryPanel
            records={historyRecords}
            onSelect={selectHistory}
            onDelete={deleteHistory}
            onClear={clearHistory}
          />
        </aside>

        <section className="main-panel">
          <ModeNotice />

          <div className="section-title">
            <div>
              <span>Mock Business Data</span>
              <h2>模拟业务数据读取</h2>
            </div>
            <p>模拟从 OMS / WMS / TMS 读取到的结构化业务上下文。</p>
          </div>

          <div className="metric-grid">
            <MetricCard icon={ClipboardList} label="订单状态" value={selectedCase.oms.orderStatus} />
            <MetricCard icon={PackageSearch} label="库存缺口" value={selectedCase.wms.shortageSummary} tone="warning" />
            <MetricCard icon={Truck} label="运输状态" value={selectedCase.tms.carrierStatus} />
            <MetricCard icon={CalendarClock} label="承诺发货" value={selectedCase.oms.promisedShipTime} />
          </div>

          <div className="data-grid">
            <DataPanel title="OMS 订单数据" eyebrow="Order Management" icon={Database}>
              <KeyValue label="订单状态" value={selectedCase.oms.orderStatus} />
              <KeyValue label="承诺发货时间" value={selectedCase.oms.promisedShipTime} />
              <KeyValue label="客户优先级" value={selectedCase.oms.customerPriority} tone="success" />
              <KeyValue label="订单金额" value={`¥${selectedCase.oms.orderAmount.toLocaleString("zh-CN")}`} />
            </DataPanel>

            <DataPanel title="WMS 仓储 / 库存数据" eyebrow="Warehouse Management" icon={Boxes}>
              {selectedCase.wms.skuList.map((sku) => (
                <div className="sku-card" key={sku.sku}>
                  <div>
                    <strong>{sku.sku}</strong>
                    <span>{sku.name}</span>
                  </div>
                  <div className="sku-numbers">
                    <span>需求 {sku.requiredQty}</span>
                    <span>可用 {sku.availableQty}</span>
                    <span className="text-warning">缺口 {sku.shortageQty}</span>
                  </div>
                </div>
              ))}
              <KeyValue label="仓库拣货状态" value={selectedCase.wms.pickingStatus} />
              <KeyValue label="可调拨仓库" value={selectedCase.wms.transferWarehouse} />
            </DataPanel>

            <DataPanel title="TMS 运输数据" eyebrow="Transportation Management" icon={Truck}>
              <KeyValue label="运输排期" value={selectedCase.tms.transportSchedule} />
              <KeyValue label="预计提货时间" value={selectedCase.tms.estimatedPickupTime} />
              <KeyValue label="当前承运状态" value={selectedCase.tms.carrierStatus} />
              <KeyValue label="延误风险" value={selectedCase.tms.delayRisk} tone={statusClass[selectedCase.tms.delayRisk] ?? "notice"} />
            </DataPanel>
          </div>

          <section className="customer-card">
            <div className="panel-heading">
              <div>
                <span>Customer Signal</span>
                <h3>客户催单信息</h3>
              </div>
              <FileWarning size={20} aria-hidden="true" />
            </div>
            <p>{selectedCase.customerMessage}</p>
          </section>

          <AgentWorkflow />

          {!aiResult && (
            <section className="empty-result">
              <FileText size={20} aria-hidden="true" />
              <div>
                <h3>等待诊断</h3>
                <p>选择示例案例或补充异常信息后，点击“开始诊断”查看结构化 AI Copilot 输出。</p>
              </div>
            </section>
          )}

          {aiResult && (
            <AiResults
              result={aiResult}
              onFeedbackSubmit={submitFeedback}
              feedbackSaved={feedbackSaved}
              onCopy={copyText}
              copiedKey={copiedKey}
            />
          )}
        </section>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
