import { defaultGithubRules, type GithubRuleOverrides } from '@mastra/factory/integrations/github/default-rules';

// Label services puts on issues filed from BrickChat feedback (see
// livinzy-homes-services feedback-issue.service.js).
export const FEEDBACK_ISSUE_LABEL = 'brickchat-feedback';

/**
 * Feedback issues are opened by this deployment's own GitHub App, so the stock
 * rule parks them in Intake as untrusted. When the App itself opened the issue
 * with the feedback label, file the card straight into Triage (which starts the
 * investigation) and mark it Factory-authored so the external-author guard
 * doesn't hold the run. Everything else keeps the stock behaviour.
 */
export const feedbackIssueRules: GithubRuleOverrides = {
  issueOpened: async context => {
    const decision = await defaultGithubRules.issueOpened?.(context);
    if (!decision || decision.type !== 'upsertLinkedWorkItem') return decision;

    const fromOwnApp = context.actor.type === 'github' && context.actor.factoryAuthored;
    const labelled = context.issue?.labels?.includes(FEEDBACK_ISSUE_LABEL) ?? false;
    if (!fromOwnApp || !labelled) return decision;

    return {
      ...decision,
      stage: 'triage',
      metadata: { ...decision.metadata, factoryAuthored: true },
    };
  },
};
