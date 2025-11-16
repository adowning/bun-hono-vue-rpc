import type * as types from './types';
import type { ConfigOptions, FetchResponse } from 'api/dist/core'
import Oas from 'oas';
import APICore from 'api/dist/core';
import definition from './openapi.json';

class SDK {
  spec: Oas;
  core: APICore;

  constructor() {
    this.spec = Oas.init(definition);
    this.core = new APICore(this.spec, 'php/13.0.7 (api/6.1.3)');
  }

  /**
   * Optionally configure various options that the SDK allows.
   *
   * @param config Object of supported SDK options and toggles.
   * @param config.timeout Override the default `fetch` request timeout of 30 seconds. This number
   * should be represented in milliseconds.
   */
  config(config: ConfigOptions) {
    this.core.setConfig(config);
  }

  /**
   * If the API you're using requires authentication you can supply the required credentials
   * through this method and the library will magically determine how they should be used
   * within your API request.
   *
   * With the exception of OpenID and MutualTLS, it supports all forms of authentication
   * supported by the OpenAPI specification.
   *
   * @example <caption>HTTP Basic auth</caption>
   * sdk.auth('username', 'password');
   *
   * @example <caption>Bearer tokens (HTTP or OAuth 2)</caption>
   * sdk.auth('myBearerToken');
   *
   * @example <caption>API Keys</caption>
   * sdk.auth('myApiKey');
   *
   * @see {@link https://spec.openapis.org/oas/v3.0.3#fixed-fields-22}
   * @see {@link https://spec.openapis.org/oas/v3.1.0#fixed-fields-22}
   * @param values Your auth credentials for the API; can specify up to two strings or numbers.
   */
  auth(...values: string[] | number[]) {
    this.core.setAuth(...values);
    return this;
  }

  /**
   * If the API you're using offers alternate server URLs, and server variables, you can tell
   * the SDK which one to use with this method. To use it you can supply either one of the
   * server URLs that are contained within the OpenAPI definition (along with any server
   * variables), or you can pass it a fully qualified URL to use (that may or may not exist
   * within the OpenAPI definition).
   *
   * @example <caption>Server URL with server variables</caption>
   * sdk.server('https://{region}.api.example.com/{basePath}', {
   *   name: 'eu',
   *   basePath: 'v14',
   * });
   *
   * @example <caption>Fully qualified server URL</caption>
   * sdk.server('https://eu.api.example.com/v14');
   *
   * @param url Server URL
   * @param variables An object of variables to replace into the server URL.
   */
  server(url: string, variables = {}) {
    this.core.setServer(url, variables);
  }

  /**
   * OpenAPI description (this document)
   *
   */
  get(): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/', 'get');
  }

  getTickets_answers(metadata?: types.GetTicketsAnswersMetadataParam): Promise<FetchResponse<200, types.GetTicketsAnswersResponse200>> {
    return this.core.fetch('/tickets_answers', 'get', metadata);
  }

  postTickets_answers(body: types.PostTicketsAnswersBodyParam, metadata?: types.PostTicketsAnswersMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/tickets_answers', 'post', body, metadata);
  }

  deleteTickets_answers(metadata?: types.DeleteTicketsAnswersMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/tickets_answers', 'delete', metadata);
  }

  patchTickets_answers(body: types.PatchTicketsAnswersBodyParam, metadata?: types.PatchTicketsAnswersMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/tickets_answers', 'patch', body, metadata);
  }

  getTournament_categories(metadata?: types.GetTournamentCategoriesMetadataParam): Promise<FetchResponse<200, types.GetTournamentCategoriesResponse200>> {
    return this.core.fetch('/tournament_categories', 'get', metadata);
  }

  postTournament_categories(body: types.PostTournamentCategoriesBodyParam, metadata?: types.PostTournamentCategoriesMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/tournament_categories', 'post', body, metadata);
  }

  deleteTournament_categories(metadata?: types.DeleteTournamentCategoriesMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/tournament_categories', 'delete', metadata);
  }

  patchTournament_categories(body: types.PatchTournamentCategoriesBodyParam, metadata?: types.PatchTournamentCategoriesMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/tournament_categories', 'patch', body, metadata);
  }

  getSettings(metadata?: types.GetSettingsMetadataParam): Promise<FetchResponse<200, types.GetSettingsResponse200>> {
    return this.core.fetch('/settings', 'get', metadata);
  }

  postSettings(body: types.PostSettingsBodyParam, metadata?: types.PostSettingsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/settings', 'post', body, metadata);
  }

  deleteSettings(metadata?: types.DeleteSettingsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/settings', 'delete', metadata);
  }

  patchSettings(body: types.PatchSettingsBodyParam, metadata?: types.PatchSettingsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/settings', 'patch', body, metadata);
  }

  getRoles(metadata?: types.GetRolesMetadataParam): Promise<FetchResponse<200, types.GetRolesResponse200>> {
    return this.core.fetch('/roles', 'get', metadata);
  }

  postRoles(body: types.PostRolesBodyParam, metadata?: types.PostRolesMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/roles', 'post', body, metadata);
  }

  deleteRoles(metadata?: types.DeleteRolesMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/roles', 'delete', metadata);
  }

  patchRoles(body: types.PatchRolesBodyParam, metadata?: types.PatchRolesMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/roles', 'patch', body, metadata);
  }

  getStat_game(metadata?: types.GetStatGameMetadataParam): Promise<FetchResponse<200, types.GetStatGameResponse200>> {
    return this.core.fetch('/stat_game', 'get', metadata);
  }

  postStat_game(body: types.PostStatGameBodyParam, metadata?: types.PostStatGameMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/stat_game', 'post', body, metadata);
  }

  deleteStat_game(metadata?: types.DeleteStatGameMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/stat_game', 'delete', metadata);
  }

  patchStat_game(body: types.PatchStatGameBodyParam, metadata?: types.PatchStatGameMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/stat_game', 'patch', body, metadata);
  }

  getUser_activity(metadata?: types.GetUserActivityMetadataParam): Promise<FetchResponse<200, types.GetUserActivityResponse200>> {
    return this.core.fetch('/user_activity', 'get', metadata);
  }

  postUser_activity(body: types.PostUserActivityBodyParam, metadata?: types.PostUserActivityMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/user_activity', 'post', body, metadata);
  }

  deleteUser_activity(metadata?: types.DeleteUserActivityMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/user_activity', 'delete', metadata);
  }

  patchUser_activity(body: types.PatchUserActivityBodyParam, metadata?: types.PatchUserActivityMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/user_activity', 'patch', body, metadata);
  }

  getPay_tickets(metadata?: types.GetPayTicketsMetadataParam): Promise<FetchResponse<200, types.GetPayTicketsResponse200>> {
    return this.core.fetch('/pay_tickets', 'get', metadata);
  }

  postPay_tickets(body: types.PostPayTicketsBodyParam, metadata?: types.PostPayTicketsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/pay_tickets', 'post', body, metadata);
  }

  deletePay_tickets(metadata?: types.DeletePayTicketsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/pay_tickets', 'delete', metadata);
  }

  patchPay_tickets(body: types.PatchPayTicketsBodyParam, metadata?: types.PatchPayTicketsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/pay_tickets', 'patch', body, metadata);
  }

  getRewards(metadata?: types.GetRewardsMetadataParam): Promise<FetchResponse<200, types.GetRewardsResponse200>> {
    return this.core.fetch('/rewards', 'get', metadata);
  }

  postRewards(body: types.PostRewardsBodyParam, metadata?: types.PostRewardsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/rewards', 'post', body, metadata);
  }

  deleteRewards(metadata?: types.DeleteRewardsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/rewards', 'delete', metadata);
  }

  patchRewards(body: types.PatchRewardsBodyParam, metadata?: types.PatchRewardsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/rewards', 'patch', body, metadata);
  }

  getCategories(metadata?: types.GetCategoriesMetadataParam): Promise<FetchResponse<200, types.GetCategoriesResponse200>> {
    return this.core.fetch('/categories', 'get', metadata);
  }

  postCategories(body: types.PostCategoriesBodyParam, metadata?: types.PostCategoriesMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/categories', 'post', body, metadata);
  }

  deleteCategories(metadata?: types.DeleteCategoriesMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/categories', 'delete', metadata);
  }

  patchCategories(body: types.PatchCategoriesBodyParam, metadata?: types.PatchCategoriesMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/categories', 'patch', body, metadata);
  }

  getTickets(metadata?: types.GetTicketsMetadataParam): Promise<FetchResponse<200, types.GetTicketsResponse200>> {
    return this.core.fetch('/tickets', 'get', metadata);
  }

  postTickets(body: types.PostTicketsBodyParam, metadata?: types.PostTicketsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/tickets', 'post', body, metadata);
  }

  deleteTickets(metadata?: types.DeleteTicketsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/tickets', 'delete', metadata);
  }

  patchTickets(body: types.PatchTicketsBodyParam, metadata?: types.PatchTicketsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/tickets', 'patch', body, metadata);
  }

  getQuick_shops(metadata?: types.GetQuickShopsMetadataParam): Promise<FetchResponse<200, types.GetQuickShopsResponse200>> {
    return this.core.fetch('/quick_shops', 'get', metadata);
  }

  postQuick_shops(body: types.PostQuickShopsBodyParam, metadata?: types.PostQuickShopsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/quick_shops', 'post', body, metadata);
  }

  deleteQuick_shops(metadata?: types.DeleteQuickShopsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/quick_shops', 'delete', metadata);
  }

  patchQuick_shops(body: types.PatchQuickShopsBodyParam, metadata?: types.PatchQuickShopsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/quick_shops', 'patch', body, metadata);
  }

  getAdmin(metadata?: types.GetAdminMetadataParam): Promise<FetchResponse<200, types.GetAdminResponse200>> {
    return this.core.fetch('/admin', 'get', metadata);
  }

  postAdmin(body: types.PostAdminBodyParam, metadata?: types.PostAdminMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/admin', 'post', body, metadata);
  }

  deleteAdmin(metadata?: types.DeleteAdminMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/admin', 'delete', metadata);
  }

  patchAdmin(body: types.PatchAdminBodyParam, metadata?: types.PatchAdminMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/admin', 'patch', body, metadata);
  }

  getSms_bonuses(metadata?: types.GetSmsBonusesMetadataParam): Promise<FetchResponse<200, types.GetSmsBonusesResponse200>> {
    return this.core.fetch('/sms_bonuses', 'get', metadata);
  }

  postSms_bonuses(body: types.PostSmsBonusesBodyParam, metadata?: types.PostSmsBonusesMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/sms_bonuses', 'post', body, metadata);
  }

  deleteSms_bonuses(metadata?: types.DeleteSmsBonusesMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/sms_bonuses', 'delete', metadata);
  }

  patchSms_bonuses(body: types.PatchSmsBonusesBodyParam, metadata?: types.PatchSmsBonusesMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/sms_bonuses', 'patch', body, metadata);
  }

  getOpen_shift_temp(metadata?: types.GetOpenShiftTempMetadataParam): Promise<FetchResponse<200, types.GetOpenShiftTempResponse200>> {
    return this.core.fetch('/open_shift_temp', 'get', metadata);
  }

  postOpen_shift_temp(body: types.PostOpenShiftTempBodyParam, metadata?: types.PostOpenShiftTempMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/open_shift_temp', 'post', body, metadata);
  }

  deleteOpen_shift_temp(metadata?: types.DeleteOpenShiftTempMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/open_shift_temp', 'delete', metadata);
  }

  patchOpen_shift_temp(body: types.PatchOpenShiftTempBodyParam, metadata?: types.PatchOpenShiftTempMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/open_shift_temp', 'patch', body, metadata);
  }

  getInfo(metadata?: types.GetInfoMetadataParam): Promise<FetchResponse<200, types.GetInfoResponse200>> {
    return this.core.fetch('/info', 'get', metadata);
  }

  postInfo(body: types.PostInfoBodyParam, metadata?: types.PostInfoMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/info', 'post', body, metadata);
  }

  deleteInfo(metadata?: types.DeleteInfoMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/info', 'delete', metadata);
  }

  patchInfo(body: types.PatchInfoBodyParam, metadata?: types.PatchInfoMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/info', 'patch', body, metadata);
  }

  getSms_mailings(metadata?: types.GetSmsMailingsMetadataParam): Promise<FetchResponse<200, types.GetSmsMailingsResponse200>> {
    return this.core.fetch('/sms_mailings', 'get', metadata);
  }

  postSms_mailings(body: types.PostSmsMailingsBodyParam, metadata?: types.PostSmsMailingsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/sms_mailings', 'post', body, metadata);
  }

  deleteSms_mailings(metadata?: types.DeleteSmsMailingsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/sms_mailings', 'delete', metadata);
  }

  patchSms_mailings(body: types.PatchSmsMailingsBodyParam, metadata?: types.PatchSmsMailingsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/sms_mailings', 'patch', body, metadata);
  }

  getTasks(metadata?: types.GetTasksMetadataParam): Promise<FetchResponse<200, types.GetTasksResponse200>> {
    return this.core.fetch('/tasks', 'get', metadata);
  }

  postTasks(body: types.PostTasksBodyParam, metadata?: types.PostTasksMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/tasks', 'post', body, metadata);
  }

  deleteTasks(metadata?: types.DeleteTasksMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/tasks', 'delete', metadata);
  }

  patchTasks(body: types.PatchTasksBodyParam, metadata?: types.PatchTasksMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/tasks', 'patch', body, metadata);
  }

  getPermissions(metadata?: types.GetPermissionsMetadataParam): Promise<FetchResponse<200, types.GetPermissionsResponse200>> {
    return this.core.fetch('/permissions', 'get', metadata);
  }

  postPermissions(body: types.PostPermissionsBodyParam, metadata?: types.PostPermissionsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/permissions', 'post', body, metadata);
  }

  deletePermissions(metadata?: types.DeletePermissionsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/permissions', 'delete', metadata);
  }

  patchPermissions(body: types.PatchPermissionsBodyParam, metadata?: types.PatchPermissionsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/permissions', 'patch', body, metadata);
  }

  getPayments(metadata?: types.GetPaymentsMetadataParam): Promise<FetchResponse<200, types.GetPaymentsResponse200>> {
    return this.core.fetch('/payments', 'get', metadata);
  }

  postPayments(body: types.PostPaymentsBodyParam, metadata?: types.PostPaymentsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/payments', 'post', body, metadata);
  }

  deletePayments(metadata?: types.DeletePaymentsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/payments', 'delete', metadata);
  }

  patchPayments(body: types.PatchPaymentsBodyParam, metadata?: types.PatchPaymentsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/payments', 'patch', body, metadata);
  }

  getMigrations(metadata?: types.GetMigrationsMetadataParam): Promise<FetchResponse<200, types.GetMigrationsResponse200>> {
    return this.core.fetch('/migrations', 'get', metadata);
  }

  postMigrations(body: types.PostMigrationsBodyParam, metadata?: types.PostMigrationsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/migrations', 'post', body, metadata);
  }

  deleteMigrations(metadata?: types.DeleteMigrationsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/migrations', 'delete', metadata);
  }

  patchMigrations(body: types.PatchMigrationsBodyParam, metadata?: types.PatchMigrationsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/migrations', 'patch', body, metadata);
  }

  getRules(metadata?: types.GetRulesMetadataParam): Promise<FetchResponse<200, types.GetRulesResponse200>> {
    return this.core.fetch('/rules', 'get', metadata);
  }

  postRules(body: types.PostRulesBodyParam, metadata?: types.PostRulesMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/rules', 'post', body, metadata);
  }

  deleteRules(metadata?: types.DeleteRulesMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/rules', 'delete', metadata);
  }

  patchRules(body: types.PatchRulesBodyParam, metadata?: types.PatchRulesMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/rules', 'patch', body, metadata);
  }

  getSessions(metadata?: types.GetSessionsMetadataParam): Promise<FetchResponse<200, types.GetSessionsResponse200>> {
    return this.core.fetch('/sessions', 'get', metadata);
  }

  postSessions(body: types.PostSessionsBodyParam, metadata?: types.PostSessionsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/sessions', 'post', body, metadata);
  }

  deleteSessions(metadata?: types.DeleteSessionsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/sessions', 'delete', metadata);
  }

  patchSessions(body: types.PatchSessionsBodyParam, metadata?: types.PatchSessionsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/sessions', 'patch', body, metadata);
  }

  getPassword_resets(metadata?: types.GetPasswordResetsMetadataParam): Promise<FetchResponse<200, types.GetPasswordResetsResponse200>> {
    return this.core.fetch('/password_resets', 'get', metadata);
  }

  postPassword_resets(body: types.PostPasswordResetsBodyParam, metadata?: types.PostPasswordResetsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/password_resets', 'post', body, metadata);
  }

  deletePassword_resets(metadata?: types.DeletePasswordResetsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/password_resets', 'delete', metadata);
  }

  patchPassword_resets(body: types.PatchPasswordResetsBodyParam, metadata?: types.PatchPasswordResetsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/password_resets', 'patch', body, metadata);
  }

  getPhinxlog(metadata?: types.GetPhinxlogMetadataParam): Promise<FetchResponse<200, types.GetPhinxlogResponse200>> {
    return this.core.fetch('/phinxlog', 'get', metadata);
  }

  postPhinxlog(body: types.PostPhinxlogBodyParam, metadata?: types.PostPhinxlogMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/phinxlog', 'post', body, metadata);
  }

  deletePhinxlog(metadata?: types.DeletePhinxlogMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/phinxlog', 'delete', metadata);
  }

  patchPhinxlog(body: types.PatchPhinxlogBodyParam, metadata?: types.PatchPhinxlogMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/phinxlog', 'patch', body, metadata);
  }

  getStatistics(metadata?: types.GetStatisticsMetadataParam): Promise<FetchResponse<200, types.GetStatisticsResponse200>> {
    return this.core.fetch('/statistics', 'get', metadata);
  }

  postStatistics(body: types.PostStatisticsBodyParam, metadata?: types.PostStatisticsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/statistics', 'post', body, metadata);
  }

  deleteStatistics(metadata?: types.DeleteStatisticsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/statistics', 'delete', metadata);
  }

  patchStatistics(body: types.PatchStatisticsBodyParam, metadata?: types.PatchStatisticsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/statistics', 'patch', body, metadata);
  }

  getSecurities(metadata?: types.GetSecuritiesMetadataParam): Promise<FetchResponse<200, types.GetSecuritiesResponse200>> {
    return this.core.fetch('/securities', 'get', metadata);
  }

  postSecurities(body: types.PostSecuritiesBodyParam, metadata?: types.PostSecuritiesMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/securities', 'post', body, metadata);
  }

  deleteSecurities(metadata?: types.DeleteSecuritiesMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/securities', 'delete', metadata);
  }

  patchSecurities(body: types.PatchSecuritiesBodyParam, metadata?: types.PatchSecuritiesMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/securities', 'patch', body, metadata);
  }

  getGame_categories(metadata?: types.GetGameCategoriesMetadataParam): Promise<FetchResponse<200, types.GetGameCategoriesResponse200>> {
    return this.core.fetch('/game_categories', 'get', metadata);
  }

  postGame_categories(body: types.PostGameCategoriesBodyParam, metadata?: types.PostGameCategoriesMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/game_categories', 'post', body, metadata);
  }

  deleteGame_categories(metadata?: types.DeleteGameCategoriesMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/game_categories', 'delete', metadata);
  }

  patchGame_categories(body: types.PatchGameCategoriesBodyParam, metadata?: types.PatchGameCategoriesMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/game_categories', 'patch', body, metadata);
  }

  getShops_os(metadata?: types.GetShopsOsMetadataParam): Promise<FetchResponse<200, types.GetShopsOsResponse200>> {
    return this.core.fetch('/shops_os', 'get', metadata);
  }

  postShops_os(body: types.PostShopsOsBodyParam, metadata?: types.PostShopsOsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/shops_os', 'post', body, metadata);
  }

  deleteShops_os(metadata?: types.DeleteShopsOsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/shops_os', 'delete', metadata);
  }

  patchShops_os(body: types.PatchShopsOsBodyParam, metadata?: types.PatchShopsOsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/shops_os', 'patch', body, metadata);
  }

  getPayment_settings(metadata?: types.GetPaymentSettingsMetadataParam): Promise<FetchResponse<200, types.GetPaymentSettingsResponse200>> {
    return this.core.fetch('/payment_settings', 'get', metadata);
  }

  postPayment_settings(body: types.PostPaymentSettingsBodyParam, metadata?: types.PostPaymentSettingsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/payment_settings', 'post', body, metadata);
  }

  deletePayment_settings(metadata?: types.DeletePaymentSettingsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/payment_settings', 'delete', metadata);
  }

  patchPayment_settings(body: types.PatchPaymentSettingsBodyParam, metadata?: types.PatchPaymentSettingsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/payment_settings', 'patch', body, metadata);
  }

  getSms(metadata?: types.GetSmsMetadataParam): Promise<FetchResponse<200, types.GetSmsResponse200>> {
    return this.core.fetch('/sms', 'get', metadata);
  }

  postSms(body: types.PostSmsBodyParam, metadata?: types.PostSmsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/sms', 'post', body, metadata);
  }

  deleteSms(metadata?: types.DeleteSmsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/sms', 'delete', metadata);
  }

  patchSms(body: types.PatchSmsBodyParam, metadata?: types.PatchSmsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/sms', 'patch', body, metadata);
  }

  getWelcomebonuses(metadata?: types.GetWelcomebonusesMetadataParam): Promise<FetchResponse<200, types.GetWelcomebonusesResponse200>> {
    return this.core.fetch('/welcomebonuses', 'get', metadata);
  }

  postWelcomebonuses(body: types.PostWelcomebonusesBodyParam, metadata?: types.PostWelcomebonusesMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/welcomebonuses', 'post', body, metadata);
  }

  deleteWelcomebonuses(metadata?: types.DeleteWelcomebonusesMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/welcomebonuses', 'delete', metadata);
  }

  patchWelcomebonuses(body: types.PatchWelcomebonusesBodyParam, metadata?: types.PatchWelcomebonusesMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/welcomebonuses', 'patch', body, metadata);
  }

  getOpen_shift(metadata?: types.GetOpenShiftMetadataParam): Promise<FetchResponse<200, types.GetOpenShiftResponse200>> {
    return this.core.fetch('/open_shift', 'get', metadata);
  }

  postOpen_shift(body: types.PostOpenShiftBodyParam, metadata?: types.PostOpenShiftMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/open_shift', 'post', body, metadata);
  }

  deleteOpen_shift(metadata?: types.DeleteOpenShiftMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/open_shift', 'delete', metadata);
  }

  patchOpen_shift(body: types.PatchOpenShiftBodyParam, metadata?: types.PatchOpenShiftMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/open_shift', 'patch', body, metadata);
  }

  getGame_bank(metadata?: types.GetGameBankMetadataParam): Promise<FetchResponse<200, types.GetGameBankResponse200>> {
    return this.core.fetch('/game_bank', 'get', metadata);
  }

  postGame_bank(body: types.PostGameBankBodyParam, metadata?: types.PostGameBankMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/game_bank', 'post', body, metadata);
  }

  deleteGame_bank(metadata?: types.DeleteGameBankMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/game_bank', 'delete', metadata);
  }

  patchGame_bank(body: types.PatchGameBankBodyParam, metadata?: types.PatchGameBankMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/game_bank', 'patch', body, metadata);
  }

  getCache(metadata?: types.GetCacheMetadataParam): Promise<FetchResponse<200, types.GetCacheResponse200>> {
    return this.core.fetch('/cache', 'get', metadata);
  }

  postCache(body: types.PostCacheBodyParam, metadata?: types.PostCacheMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/cache', 'post', body, metadata);
  }

  deleteCache(metadata?: types.DeleteCacheMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/cache', 'delete', metadata);
  }

  patchCache(body: types.PatchCacheBodyParam, metadata?: types.PatchCacheMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/cache', 'patch', body, metadata);
  }

  getHappyhours(metadata?: types.GetHappyhoursMetadataParam): Promise<FetchResponse<200, types.GetHappyhoursResponse200>> {
    return this.core.fetch('/happyhours', 'get', metadata);
  }

  postHappyhours(body: types.PostHappyhoursBodyParam, metadata?: types.PostHappyhoursMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/happyhours', 'post', body, metadata);
  }

  deleteHappyhours(metadata?: types.DeleteHappyhoursMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/happyhours', 'delete', metadata);
  }

  patchHappyhours(body: types.PatchHappyhoursBodyParam, metadata?: types.PatchHappyhoursMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/happyhours', 'patch', body, metadata);
  }

  getStatistics_add(metadata?: types.GetStatisticsAddMetadataParam): Promise<FetchResponse<200, types.GetStatisticsAddResponse200>> {
    return this.core.fetch('/statistics_add', 'get', metadata);
  }

  postStatistics_add(body: types.PostStatisticsAddBodyParam, metadata?: types.PostStatisticsAddMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/statistics_add', 'post', body, metadata);
  }

  deleteStatistics_add(metadata?: types.DeleteStatisticsAddMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/statistics_add', 'delete', metadata);
  }

  patchStatistics_add(body: types.PatchStatisticsAddBodyParam, metadata?: types.PatchStatisticsAddMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/statistics_add', 'patch', body, metadata);
  }

  getInvites(metadata?: types.GetInvitesMetadataParam): Promise<FetchResponse<200, types.GetInvitesResponse200>> {
    return this.core.fetch('/invites', 'get', metadata);
  }

  postInvites(body: types.PostInvitesBodyParam, metadata?: types.PostInvitesMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/invites', 'post', body, metadata);
  }

  deleteInvites(metadata?: types.DeleteInvitesMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/invites', 'delete', metadata);
  }

  patchInvites(body: types.PatchInvitesBodyParam, metadata?: types.PatchInvitesMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/invites', 'patch', body, metadata);
  }

  getShops(metadata?: types.GetShopsMetadataParam): Promise<FetchResponse<200, types.GetShopsResponse200>> {
    return this.core.fetch('/shops', 'get', metadata);
  }

  postShops(body: types.PostShopsBodyParam, metadata?: types.PostShopsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/shops', 'post', body, metadata);
  }

  deleteShops(metadata?: types.DeleteShopsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/shops', 'delete', metadata);
  }

  patchShops(body: types.PatchShopsBodyParam, metadata?: types.PatchShopsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/shops', 'patch', body, metadata);
  }

  getSubsessions(metadata?: types.GetSubsessionsMetadataParam): Promise<FetchResponse<200, types.GetSubsessionsResponse200>> {
    return this.core.fetch('/subsessions', 'get', metadata);
  }

  postSubsessions(body: types.PostSubsessionsBodyParam, metadata?: types.PostSubsessionsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/subsessions', 'post', body, metadata);
  }

  deleteSubsessions(metadata?: types.DeleteSubsessionsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/subsessions', 'delete', metadata);
  }

  patchSubsessions(body: types.PatchSubsessionsBodyParam, metadata?: types.PatchSubsessionsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/subsessions', 'patch', body, metadata);
  }

  getInfo_shop(metadata?: types.GetInfoShopMetadataParam): Promise<FetchResponse<200, types.GetInfoShopResponse200>> {
    return this.core.fetch('/info_shop', 'get', metadata);
  }

  postInfo_shop(body: types.PostInfoShopBodyParam, metadata?: types.PostInfoShopMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/info_shop', 'post', body, metadata);
  }

  deleteInfo_shop(metadata?: types.DeleteInfoShopMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/info_shop', 'delete', metadata);
  }

  patchInfo_shop(body: types.PatchInfoShopBodyParam, metadata?: types.PatchInfoShopMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/info_shop', 'patch', body, metadata);
  }

  getProgress(metadata?: types.GetProgressMetadataParam): Promise<FetchResponse<200, types.GetProgressResponse200>> {
    return this.core.fetch('/progress', 'get', metadata);
  }

  postProgress(body: types.PostProgressBodyParam, metadata?: types.PostProgressMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/progress', 'post', body, metadata);
  }

  deleteProgress(metadata?: types.DeleteProgressMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/progress', 'delete', metadata);
  }

  patchProgress(body: types.PatchProgressBodyParam, metadata?: types.PatchProgressMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/progress', 'patch', body, metadata);
  }

  getTournament_games(metadata?: types.GetTournamentGamesMetadataParam): Promise<FetchResponse<200, types.GetTournamentGamesResponse200>> {
    return this.core.fetch('/tournament_games', 'get', metadata);
  }

  postTournament_games(body: types.PostTournamentGamesBodyParam, metadata?: types.PostTournamentGamesMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/tournament_games', 'post', body, metadata);
  }

  deleteTournament_games(metadata?: types.DeleteTournamentGamesMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/tournament_games', 'delete', metadata);
  }

  patchTournament_games(body: types.PatchTournamentGamesBodyParam, metadata?: types.PatchTournamentGamesMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/tournament_games', 'patch', body, metadata);
  }

  getAtm(metadata?: types.GetAtmMetadataParam): Promise<FetchResponse<200, types.GetAtmResponse200>> {
    return this.core.fetch('/atm', 'get', metadata);
  }

  postAtm(body: types.PostAtmBodyParam, metadata?: types.PostAtmMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/atm', 'post', body, metadata);
  }

  deleteAtm(metadata?: types.DeleteAtmMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/atm', 'delete', metadata);
  }

  patchAtm(body: types.PatchAtmBodyParam, metadata?: types.PatchAtmMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/atm', 'patch', body, metadata);
  }

  getTournaments(metadata?: types.GetTournamentsMetadataParam): Promise<FetchResponse<200, types.GetTournamentsResponse200>> {
    return this.core.fetch('/tournaments', 'get', metadata);
  }

  postTournaments(body: types.PostTournamentsBodyParam, metadata?: types.PostTournamentsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/tournaments', 'post', body, metadata);
  }

  deleteTournaments(metadata?: types.DeleteTournamentsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/tournaments', 'delete', metadata);
  }

  patchTournaments(body: types.PatchTournamentsBodyParam, metadata?: types.PatchTournamentsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/tournaments', 'patch', body, metadata);
  }

  getShops_user(metadata?: types.GetShopsUserMetadataParam): Promise<FetchResponse<200, types.GetShopsUserResponse200>> {
    return this.core.fetch('/shops_user', 'get', metadata);
  }

  postShops_user(body: types.PostShopsUserBodyParam, metadata?: types.PostShopsUserMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/shops_user', 'post', body, metadata);
  }

  deleteShops_user(metadata?: types.DeleteShopsUserMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/shops_user', 'delete', metadata);
  }

  patchShops_user(body: types.PatchShopsUserBodyParam, metadata?: types.PatchShopsUserMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/shops_user', 'patch', body, metadata);
  }

  getCredits(metadata?: types.GetCreditsMetadataParam): Promise<FetchResponse<200, types.GetCreditsResponse200>> {
    return this.core.fetch('/credits', 'get', metadata);
  }

  postCredits(body: types.PostCreditsBodyParam, metadata?: types.PostCreditsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/credits', 'post', body, metadata);
  }

  deleteCredits(metadata?: types.DeleteCreditsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/credits', 'delete', metadata);
  }

  patchCredits(body: types.PatchCreditsBodyParam, metadata?: types.PatchCreditsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/credits', 'patch', body, metadata);
  }

  getNotifications(metadata?: types.GetNotificationsMetadataParam): Promise<FetchResponse<200, types.GetNotificationsResponse200>> {
    return this.core.fetch('/notifications', 'get', metadata);
  }

  postNotifications(body: types.PostNotificationsBodyParam, metadata?: types.PostNotificationsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/notifications', 'post', body, metadata);
  }

  deleteNotifications(metadata?: types.DeleteNotificationsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/notifications', 'delete', metadata);
  }

  patchNotifications(body: types.PatchNotificationsBodyParam, metadata?: types.PatchNotificationsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/notifications', 'patch', body, metadata);
  }

  getMessages(metadata?: types.GetMessagesMetadataParam): Promise<FetchResponse<200, types.GetMessagesResponse200>> {
    return this.core.fetch('/messages', 'get', metadata);
  }

  postMessages(body: types.PostMessagesBodyParam, metadata?: types.PostMessagesMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/messages', 'post', body, metadata);
  }

  deleteMessages(metadata?: types.DeleteMessagesMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/messages', 'delete', metadata);
  }

  patchMessages(body: types.PatchMessagesBodyParam, metadata?: types.PatchMessagesMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/messages', 'patch', body, metadata);
  }

  getSms_mailing_messages(metadata?: types.GetSmsMailingMessagesMetadataParam): Promise<FetchResponse<200, types.GetSmsMailingMessagesResponse200>> {
    return this.core.fetch('/sms_mailing_messages', 'get', metadata);
  }

  postSms_mailing_messages(body: types.PostSmsMailingMessagesBodyParam, metadata?: types.PostSmsMailingMessagesMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/sms_mailing_messages', 'post', body, metadata);
  }

  deleteSms_mailing_messages(metadata?: types.DeleteSmsMailingMessagesMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/sms_mailing_messages', 'delete', metadata);
  }

  patchSms_mailing_messages(body: types.PatchSmsMailingMessagesBodyParam, metadata?: types.PatchSmsMailingMessagesMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/sms_mailing_messages', 'patch', body, metadata);
  }

  getShops_countries(metadata?: types.GetShopsCountriesMetadataParam): Promise<FetchResponse<200, types.GetShopsCountriesResponse200>> {
    return this.core.fetch('/shops_countries', 'get', metadata);
  }

  postShops_countries(body: types.PostShopsCountriesBodyParam, metadata?: types.PostShopsCountriesMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/shops_countries', 'post', body, metadata);
  }

  deleteShops_countries(metadata?: types.DeleteShopsCountriesMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/shops_countries', 'delete', metadata);
  }

  patchShops_countries(body: types.PatchShopsCountriesBodyParam, metadata?: types.PatchShopsCountriesMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/shops_countries', 'patch', body, metadata);
  }

  getGame_log(metadata?: types.GetGameLogMetadataParam): Promise<FetchResponse<200, types.GetGameLogResponse200>> {
    return this.core.fetch('/game_log', 'get', metadata);
  }

  postGame_log(body: types.PostGameLogBodyParam, metadata?: types.PostGameLogMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/game_log', 'post', body, metadata);
  }

  deleteGame_log(metadata?: types.DeleteGameLogMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/game_log', 'delete', metadata);
  }

  patchGame_log(body: types.PatchGameLogBodyParam, metadata?: types.PatchGameLogMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/game_log', 'patch', body, metadata);
  }

  getProgress_users(metadata?: types.GetProgressUsersMetadataParam): Promise<FetchResponse<200, types.GetProgressUsersResponse200>> {
    return this.core.fetch('/progress_users', 'get', metadata);
  }

  postProgress_users(body: types.PostProgressUsersBodyParam, metadata?: types.PostProgressUsersMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/progress_users', 'post', body, metadata);
  }

  deleteProgress_users(metadata?: types.DeleteProgressUsersMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/progress_users', 'delete', metadata);
  }

  patchProgress_users(body: types.PatchProgressUsersBodyParam, metadata?: types.PatchProgressUsersMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/progress_users', 'patch', body, metadata);
  }

  getShop_categories(metadata?: types.GetShopCategoriesMetadataParam): Promise<FetchResponse<200, types.GetShopCategoriesResponse200>> {
    return this.core.fetch('/shop_categories', 'get', metadata);
  }

  postShop_categories(body: types.PostShopCategoriesBodyParam, metadata?: types.PostShopCategoriesMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/shop_categories', 'post', body, metadata);
  }

  deleteShop_categories(metadata?: types.DeleteShopCategoriesMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/shop_categories', 'delete', metadata);
  }

  patchShop_categories(body: types.PatchShopCategoriesBodyParam, metadata?: types.PatchShopCategoriesMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/shop_categories', 'patch', body, metadata);
  }

  getFailed_jobs(metadata?: types.GetFailedJobsMetadataParam): Promise<FetchResponse<200, types.GetFailedJobsResponse200>> {
    return this.core.fetch('/failed_jobs', 'get', metadata);
  }

  postFailed_jobs(body: types.PostFailedJobsBodyParam, metadata?: types.PostFailedJobsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/failed_jobs', 'post', body, metadata);
  }

  deleteFailed_jobs(metadata?: types.DeleteFailedJobsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/failed_jobs', 'delete', metadata);
  }

  patchFailed_jobs(body: types.PatchFailedJobsBodyParam, metadata?: types.PatchFailedJobsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/failed_jobs', 'patch', body, metadata);
  }

  getSms_bonus_items(metadata?: types.GetSmsBonusItemsMetadataParam): Promise<FetchResponse<200, types.GetSmsBonusItemsResponse200>> {
    return this.core.fetch('/sms_bonus_items', 'get', metadata);
  }

  postSms_bonus_items(body: types.PostSmsBonusItemsBodyParam, metadata?: types.PostSmsBonusItemsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/sms_bonus_items', 'post', body, metadata);
  }

  deleteSms_bonus_items(metadata?: types.DeleteSmsBonusItemsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/sms_bonus_items', 'delete', metadata);
  }

  patchSms_bonus_items(body: types.PatchSmsBonusItemsBodyParam, metadata?: types.PatchSmsBonusItemsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/sms_bonus_items', 'patch', body, metadata);
  }

  getApi_tokens(metadata?: types.GetApiTokensMetadataParam): Promise<FetchResponse<200, types.GetApiTokensResponse200>> {
    return this.core.fetch('/api_tokens', 'get', metadata);
  }

  postApi_tokens(body: types.PostApiTokensBodyParam, metadata?: types.PostApiTokensMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/api_tokens', 'post', body, metadata);
  }

  deleteApi_tokens(metadata?: types.DeleteApiTokensMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/api_tokens', 'delete', metadata);
  }

  patchApi_tokens(body: types.PatchApiTokensBodyParam, metadata?: types.PatchApiTokensMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/api_tokens', 'patch', body, metadata);
  }

  getTournament_bots(metadata?: types.GetTournamentBotsMetadataParam): Promise<FetchResponse<200, types.GetTournamentBotsResponse200>> {
    return this.core.fetch('/tournament_bots', 'get', metadata);
  }

  postTournament_bots(body: types.PostTournamentBotsBodyParam, metadata?: types.PostTournamentBotsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/tournament_bots', 'post', body, metadata);
  }

  deleteTournament_bots(metadata?: types.DeleteTournamentBotsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/tournament_bots', 'delete', metadata);
  }

  patchTournament_bots(body: types.PatchTournamentBotsBodyParam, metadata?: types.PatchTournamentBotsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/tournament_bots', 'patch', body, metadata);
  }

  getUsers(metadata?: types.GetUsersMetadataParam): Promise<FetchResponse<200, types.GetUsersResponse200>> {
    return this.core.fetch('/users', 'get', metadata);
  }

  postUsers(body: types.PostUsersBodyParam, metadata?: types.PostUsersMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/users', 'post', body, metadata);
  }

  deleteUsers(metadata?: types.DeleteUsersMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/users', 'delete', metadata);
  }

  patchUsers(body: types.PatchUsersBodyParam, metadata?: types.PatchUsersMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/users', 'patch', body, metadata);
  }

  getFaqs(metadata?: types.GetFaqsMetadataParam): Promise<FetchResponse<200, types.GetFaqsResponse200>> {
    return this.core.fetch('/faqs', 'get', metadata);
  }

  postFaqs(body: types.PostFaqsBodyParam, metadata?: types.PostFaqsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/faqs', 'post', body, metadata);
  }

  deleteFaqs(metadata?: types.DeleteFaqsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/faqs', 'delete', metadata);
  }

  patchFaqs(body: types.PatchFaqsBodyParam, metadata?: types.PatchFaqsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/faqs', 'patch', body, metadata);
  }

  getShops_devices(metadata?: types.GetShopsDevicesMetadataParam): Promise<FetchResponse<200, types.GetShopsDevicesResponse200>> {
    return this.core.fetch('/shops_devices', 'get', metadata);
  }

  postShops_devices(body: types.PostShopsDevicesBodyParam, metadata?: types.PostShopsDevicesMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/shops_devices', 'post', body, metadata);
  }

  deleteShops_devices(metadata?: types.DeleteShopsDevicesMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/shops_devices', 'delete', metadata);
  }

  patchShops_devices(body: types.PatchShopsDevicesBodyParam, metadata?: types.PatchShopsDevicesMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/shops_devices', 'patch', body, metadata);
  }

  getTournament_prizes(metadata?: types.GetTournamentPrizesMetadataParam): Promise<FetchResponse<200, types.GetTournamentPrizesResponse200>> {
    return this.core.fetch('/tournament_prizes', 'get', metadata);
  }

  postTournament_prizes(body: types.PostTournamentPrizesBodyParam, metadata?: types.PostTournamentPrizesMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/tournament_prizes', 'post', body, metadata);
  }

  deleteTournament_prizes(metadata?: types.DeleteTournamentPrizesMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/tournament_prizes', 'delete', metadata);
  }

  patchTournament_prizes(body: types.PatchTournamentPrizesBodyParam, metadata?: types.PatchTournamentPrizesMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/tournament_prizes', 'patch', body, metadata);
  }

  getFish_bank(metadata?: types.GetFishBankMetadataParam): Promise<FetchResponse<200, types.GetFishBankResponse200>> {
    return this.core.fetch('/fish_bank', 'get', metadata);
  }

  postFish_bank(body: types.PostFishBankBodyParam, metadata?: types.PostFishBankMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/fish_bank', 'post', body, metadata);
  }

  deleteFish_bank(metadata?: types.DeleteFishBankMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/fish_bank', 'delete', metadata);
  }

  patchFish_bank(body: types.PatchFishBankBodyParam, metadata?: types.PatchFishBankMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/fish_bank', 'patch', body, metadata);
  }

  getWithdrafunds(metadata?: types.GetWithdrafundsMetadataParam): Promise<FetchResponse<200, types.GetWithdrafundsResponse200>> {
    return this.core.fetch('/withdrafunds', 'get', metadata);
  }

  postWithdrafunds(body: types.PostWithdrafundsBodyParam, metadata?: types.PostWithdrafundsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/withdrafunds', 'post', body, metadata);
  }

  deleteWithdrafunds(metadata?: types.DeleteWithdrafundsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/withdrafunds', 'delete', metadata);
  }

  patchWithdrafunds(body: types.PatchWithdrafundsBodyParam, metadata?: types.PatchWithdrafundsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/withdrafunds', 'patch', body, metadata);
  }

  getRole_user(metadata?: types.GetRoleUserMetadataParam): Promise<FetchResponse<200, types.GetRoleUserResponse200>> {
    return this.core.fetch('/role_user', 'get', metadata);
  }

  postRole_user(body: types.PostRoleUserBodyParam, metadata?: types.PostRoleUserMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/role_user', 'post', body, metadata);
  }

  deleteRole_user(metadata?: types.DeleteRoleUserMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/role_user', 'delete', metadata);
  }

  patchRole_user(body: types.PatchRoleUserBodyParam, metadata?: types.PatchRoleUserMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/role_user', 'patch', body, metadata);
  }

  getTournament_stats(metadata?: types.GetTournamentStatsMetadataParam): Promise<FetchResponse<200, types.GetTournamentStatsResponse200>> {
    return this.core.fetch('/tournament_stats', 'get', metadata);
  }

  postTournament_stats(body: types.PostTournamentStatsBodyParam, metadata?: types.PostTournamentStatsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/tournament_stats', 'post', body, metadata);
  }

  deleteTournament_stats(metadata?: types.DeleteTournamentStatsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/tournament_stats', 'delete', metadata);
  }

  patchTournament_stats(body: types.PatchTournamentStatsBodyParam, metadata?: types.PatchTournamentStatsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/tournament_stats', 'patch', body, metadata);
  }

  getPermission_role(metadata?: types.GetPermissionRoleMetadataParam): Promise<FetchResponse<200, types.GetPermissionRoleResponse200>> {
    return this.core.fetch('/permission_role', 'get', metadata);
  }

  postPermission_role(body: types.PostPermissionRoleBodyParam, metadata?: types.PostPermissionRoleMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/permission_role', 'post', body, metadata);
  }

  deletePermission_role(metadata?: types.DeletePermissionRoleMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/permission_role', 'delete', metadata);
  }

  patchPermission_role(body: types.PatchPermissionRoleBodyParam, metadata?: types.PatchPermissionRoleMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/permission_role', 'patch', body, metadata);
  }

  getGames(metadata?: types.GetGamesMetadataParam): Promise<FetchResponse<200, types.GetGamesResponse200>> {
    return this.core.fetch('/games', 'get', metadata);
  }

  postGames(body: types.PostGamesBodyParam, metadata?: types.PostGamesMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/games', 'post', body, metadata);
  }

  deleteGames(metadata?: types.DeleteGamesMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/games', 'delete', metadata);
  }

  patchGames(body: types.PatchGamesBodyParam, metadata?: types.PatchGamesMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/games', 'patch', body, metadata);
  }

  getApis(metadata?: types.GetApisMetadataParam): Promise<FetchResponse<200, types.GetApisResponse200>> {
    return this.core.fetch('/apis', 'get', metadata);
  }

  postApis(body: types.PostApisBodyParam, metadata?: types.PostApisMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/apis', 'post', body, metadata);
  }

  deleteApis(metadata?: types.DeleteApisMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/apis', 'delete', metadata);
  }

  patchApis(body: types.PatchApisBodyParam, metadata?: types.PatchApisMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/apis', 'patch', body, metadata);
  }

  getWheelfortune(metadata?: types.GetWheelfortuneMetadataParam): Promise<FetchResponse<200, types.GetWheelfortuneResponse200>> {
    return this.core.fetch('/wheelfortune', 'get', metadata);
  }

  postWheelfortune(body: types.PostWheelfortuneBodyParam, metadata?: types.PostWheelfortuneMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/wheelfortune', 'post', body, metadata);
  }

  deleteWheelfortune(metadata?: types.DeleteWheelfortuneMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/wheelfortune', 'delete', metadata);
  }

  patchWheelfortune(body: types.PatchWheelfortuneBodyParam, metadata?: types.PatchWheelfortuneMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/wheelfortune', 'patch', body, metadata);
  }

  getJobs(metadata?: types.GetJobsMetadataParam): Promise<FetchResponse<200, types.GetJobsResponse200>> {
    return this.core.fetch('/jobs', 'get', metadata);
  }

  postJobs(body: types.PostJobsBodyParam, metadata?: types.PostJobsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/jobs', 'post', body, metadata);
  }

  deleteJobs(metadata?: types.DeleteJobsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/jobs', 'delete', metadata);
  }

  patchJobs(body: types.PatchJobsBodyParam, metadata?: types.PatchJobsMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/jobs', 'patch', body, metadata);
  }

  getJpg(metadata?: types.GetJpgMetadataParam): Promise<FetchResponse<200, types.GetJpgResponse200>> {
    return this.core.fetch('/jpg', 'get', metadata);
  }

  postJpg(body: types.PostJpgBodyParam, metadata?: types.PostJpgMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/jpg', 'post', body, metadata);
  }

  deleteJpg(metadata?: types.DeleteJpgMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/jpg', 'delete', metadata);
  }

  patchJpg(body: types.PatchJpgBodyParam, metadata?: types.PatchJpgMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/jpg', 'patch', body, metadata);
  }

  getPermission_user(metadata?: types.GetPermissionUserMetadataParam): Promise<FetchResponse<200, types.GetPermissionUserResponse200>> {
    return this.core.fetch('/permission_user', 'get', metadata);
  }

  postPermission_user(body: types.PostPermissionUserBodyParam, metadata?: types.PostPermissionUserMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/permission_user', 'post', body, metadata);
  }

  deletePermission_user(metadata?: types.DeletePermissionUserMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/permission_user', 'delete', metadata);
  }

  patchPermission_user(body: types.PatchPermissionUserBodyParam, metadata?: types.PatchPermissionUserMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/permission_user', 'patch', body, metadata);
  }

  getPincodes(metadata?: types.GetPincodesMetadataParam): Promise<FetchResponse<200, types.GetPincodesResponse200>> {
    return this.core.fetch('/pincodes', 'get', metadata);
  }

  postPincodes(body: types.PostPincodesBodyParam, metadata?: types.PostPincodesMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/pincodes', 'post', body, metadata);
  }

  deletePincodes(metadata?: types.DeletePincodesMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/pincodes', 'delete', metadata);
  }

  patchPincodes(body: types.PatchPincodesBodyParam, metadata?: types.PatchPincodesMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/pincodes', 'patch', body, metadata);
  }

  getArticles(metadata?: types.GetArticlesMetadataParam): Promise<FetchResponse<200, types.GetArticlesResponse200>> {
    return this.core.fetch('/articles', 'get', metadata);
  }

  postArticles(body: types.PostArticlesBodyParam, metadata?: types.PostArticlesMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/articles', 'post', body, metadata);
  }

  deleteArticles(metadata?: types.DeleteArticlesMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/articles', 'delete', metadata);
  }

  patchArticles(body: types.PatchArticlesBodyParam, metadata?: types.PatchArticlesMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/articles', 'patch', body, metadata);
  }
}

const createSDK = (() => { return new SDK(); })()
;

export default createSDK;

export type { DeleteAdminMetadataParam, DeleteApiTokensMetadataParam, DeleteApisMetadataParam, DeleteArticlesMetadataParam, DeleteAtmMetadataParam, DeleteCacheMetadataParam, DeleteCategoriesMetadataParam, DeleteCreditsMetadataParam, DeleteFailedJobsMetadataParam, DeleteFaqsMetadataParam, DeleteFishBankMetadataParam, DeleteGameBankMetadataParam, DeleteGameCategoriesMetadataParam, DeleteGameLogMetadataParam, DeleteGamesMetadataParam, DeleteHappyhoursMetadataParam, DeleteInfoMetadataParam, DeleteInfoShopMetadataParam, DeleteInvitesMetadataParam, DeleteJobsMetadataParam, DeleteJpgMetadataParam, DeleteMessagesMetadataParam, DeleteMigrationsMetadataParam, DeleteNotificationsMetadataParam, DeleteOpenShiftMetadataParam, DeleteOpenShiftTempMetadataParam, DeletePasswordResetsMetadataParam, DeletePayTicketsMetadataParam, DeletePaymentSettingsMetadataParam, DeletePaymentsMetadataParam, DeletePermissionRoleMetadataParam, DeletePermissionUserMetadataParam, DeletePermissionsMetadataParam, DeletePhinxlogMetadataParam, DeletePincodesMetadataParam, DeleteProgressMetadataParam, DeleteProgressUsersMetadataParam, DeleteQuickShopsMetadataParam, DeleteRewardsMetadataParam, DeleteRoleUserMetadataParam, DeleteRolesMetadataParam, DeleteRulesMetadataParam, DeleteSecuritiesMetadataParam, DeleteSessionsMetadataParam, DeleteSettingsMetadataParam, DeleteShopCategoriesMetadataParam, DeleteShopsCountriesMetadataParam, DeleteShopsDevicesMetadataParam, DeleteShopsMetadataParam, DeleteShopsOsMetadataParam, DeleteShopsUserMetadataParam, DeleteSmsBonusItemsMetadataParam, DeleteSmsBonusesMetadataParam, DeleteSmsMailingMessagesMetadataParam, DeleteSmsMailingsMetadataParam, DeleteSmsMetadataParam, DeleteStatGameMetadataParam, DeleteStatisticsAddMetadataParam, DeleteStatisticsMetadataParam, DeleteSubsessionsMetadataParam, DeleteTasksMetadataParam, DeleteTicketsAnswersMetadataParam, DeleteTicketsMetadataParam, DeleteTournamentBotsMetadataParam, DeleteTournamentCategoriesMetadataParam, DeleteTournamentGamesMetadataParam, DeleteTournamentPrizesMetadataParam, DeleteTournamentStatsMetadataParam, DeleteTournamentsMetadataParam, DeleteUserActivityMetadataParam, DeleteUsersMetadataParam, DeleteWelcomebonusesMetadataParam, DeleteWheelfortuneMetadataParam, DeleteWithdrafundsMetadataParam, GetAdminMetadataParam, GetAdminResponse200, GetApiTokensMetadataParam, GetApiTokensResponse200, GetApisMetadataParam, GetApisResponse200, GetArticlesMetadataParam, GetArticlesResponse200, GetAtmMetadataParam, GetAtmResponse200, GetCacheMetadataParam, GetCacheResponse200, GetCategoriesMetadataParam, GetCategoriesResponse200, GetCreditsMetadataParam, GetCreditsResponse200, GetFailedJobsMetadataParam, GetFailedJobsResponse200, GetFaqsMetadataParam, GetFaqsResponse200, GetFishBankMetadataParam, GetFishBankResponse200, GetGameBankMetadataParam, GetGameBankResponse200, GetGameCategoriesMetadataParam, GetGameCategoriesResponse200, GetGameLogMetadataParam, GetGameLogResponse200, GetGamesMetadataParam, GetGamesResponse200, GetHappyhoursMetadataParam, GetHappyhoursResponse200, GetInfoMetadataParam, GetInfoResponse200, GetInfoShopMetadataParam, GetInfoShopResponse200, GetInvitesMetadataParam, GetInvitesResponse200, GetJobsMetadataParam, GetJobsResponse200, GetJpgMetadataParam, GetJpgResponse200, GetMessagesMetadataParam, GetMessagesResponse200, GetMigrationsMetadataParam, GetMigrationsResponse200, GetNotificationsMetadataParam, GetNotificationsResponse200, GetOpenShiftMetadataParam, GetOpenShiftResponse200, GetOpenShiftTempMetadataParam, GetOpenShiftTempResponse200, GetPasswordResetsMetadataParam, GetPasswordResetsResponse200, GetPayTicketsMetadataParam, GetPayTicketsResponse200, GetPaymentSettingsMetadataParam, GetPaymentSettingsResponse200, GetPaymentsMetadataParam, GetPaymentsResponse200, GetPermissionRoleMetadataParam, GetPermissionRoleResponse200, GetPermissionUserMetadataParam, GetPermissionUserResponse200, GetPermissionsMetadataParam, GetPermissionsResponse200, GetPhinxlogMetadataParam, GetPhinxlogResponse200, GetPincodesMetadataParam, GetPincodesResponse200, GetProgressMetadataParam, GetProgressResponse200, GetProgressUsersMetadataParam, GetProgressUsersResponse200, GetQuickShopsMetadataParam, GetQuickShopsResponse200, GetRewardsMetadataParam, GetRewardsResponse200, GetRoleUserMetadataParam, GetRoleUserResponse200, GetRolesMetadataParam, GetRolesResponse200, GetRulesMetadataParam, GetRulesResponse200, GetSecuritiesMetadataParam, GetSecuritiesResponse200, GetSessionsMetadataParam, GetSessionsResponse200, GetSettingsMetadataParam, GetSettingsResponse200, GetShopCategoriesMetadataParam, GetShopCategoriesResponse200, GetShopsCountriesMetadataParam, GetShopsCountriesResponse200, GetShopsDevicesMetadataParam, GetShopsDevicesResponse200, GetShopsMetadataParam, GetShopsOsMetadataParam, GetShopsOsResponse200, GetShopsResponse200, GetShopsUserMetadataParam, GetShopsUserResponse200, GetSmsBonusItemsMetadataParam, GetSmsBonusItemsResponse200, GetSmsBonusesMetadataParam, GetSmsBonusesResponse200, GetSmsMailingMessagesMetadataParam, GetSmsMailingMessagesResponse200, GetSmsMailingsMetadataParam, GetSmsMailingsResponse200, GetSmsMetadataParam, GetSmsResponse200, GetStatGameMetadataParam, GetStatGameResponse200, GetStatisticsAddMetadataParam, GetStatisticsAddResponse200, GetStatisticsMetadataParam, GetStatisticsResponse200, GetSubsessionsMetadataParam, GetSubsessionsResponse200, GetTasksMetadataParam, GetTasksResponse200, GetTicketsAnswersMetadataParam, GetTicketsAnswersResponse200, GetTicketsMetadataParam, GetTicketsResponse200, GetTournamentBotsMetadataParam, GetTournamentBotsResponse200, GetTournamentCategoriesMetadataParam, GetTournamentCategoriesResponse200, GetTournamentGamesMetadataParam, GetTournamentGamesResponse200, GetTournamentPrizesMetadataParam, GetTournamentPrizesResponse200, GetTournamentStatsMetadataParam, GetTournamentStatsResponse200, GetTournamentsMetadataParam, GetTournamentsResponse200, GetUserActivityMetadataParam, GetUserActivityResponse200, GetUsersMetadataParam, GetUsersResponse200, GetWelcomebonusesMetadataParam, GetWelcomebonusesResponse200, GetWheelfortuneMetadataParam, GetWheelfortuneResponse200, GetWithdrafundsMetadataParam, GetWithdrafundsResponse200, PatchAdminBodyParam, PatchAdminMetadataParam, PatchApiTokensBodyParam, PatchApiTokensMetadataParam, PatchApisBodyParam, PatchApisMetadataParam, PatchArticlesBodyParam, PatchArticlesMetadataParam, PatchAtmBodyParam, PatchAtmMetadataParam, PatchCacheBodyParam, PatchCacheMetadataParam, PatchCategoriesBodyParam, PatchCategoriesMetadataParam, PatchCreditsBodyParam, PatchCreditsMetadataParam, PatchFailedJobsBodyParam, PatchFailedJobsMetadataParam, PatchFaqsBodyParam, PatchFaqsMetadataParam, PatchFishBankBodyParam, PatchFishBankMetadataParam, PatchGameBankBodyParam, PatchGameBankMetadataParam, PatchGameCategoriesBodyParam, PatchGameCategoriesMetadataParam, PatchGameLogBodyParam, PatchGameLogMetadataParam, PatchGamesBodyParam, PatchGamesMetadataParam, PatchHappyhoursBodyParam, PatchHappyhoursMetadataParam, PatchInfoBodyParam, PatchInfoMetadataParam, PatchInfoShopBodyParam, PatchInfoShopMetadataParam, PatchInvitesBodyParam, PatchInvitesMetadataParam, PatchJobsBodyParam, PatchJobsMetadataParam, PatchJpgBodyParam, PatchJpgMetadataParam, PatchMessagesBodyParam, PatchMessagesMetadataParam, PatchMigrationsBodyParam, PatchMigrationsMetadataParam, PatchNotificationsBodyParam, PatchNotificationsMetadataParam, PatchOpenShiftBodyParam, PatchOpenShiftMetadataParam, PatchOpenShiftTempBodyParam, PatchOpenShiftTempMetadataParam, PatchPasswordResetsBodyParam, PatchPasswordResetsMetadataParam, PatchPayTicketsBodyParam, PatchPayTicketsMetadataParam, PatchPaymentSettingsBodyParam, PatchPaymentSettingsMetadataParam, PatchPaymentsBodyParam, PatchPaymentsMetadataParam, PatchPermissionRoleBodyParam, PatchPermissionRoleMetadataParam, PatchPermissionUserBodyParam, PatchPermissionUserMetadataParam, PatchPermissionsBodyParam, PatchPermissionsMetadataParam, PatchPhinxlogBodyParam, PatchPhinxlogMetadataParam, PatchPincodesBodyParam, PatchPincodesMetadataParam, PatchProgressBodyParam, PatchProgressMetadataParam, PatchProgressUsersBodyParam, PatchProgressUsersMetadataParam, PatchQuickShopsBodyParam, PatchQuickShopsMetadataParam, PatchRewardsBodyParam, PatchRewardsMetadataParam, PatchRoleUserBodyParam, PatchRoleUserMetadataParam, PatchRolesBodyParam, PatchRolesMetadataParam, PatchRulesBodyParam, PatchRulesMetadataParam, PatchSecuritiesBodyParam, PatchSecuritiesMetadataParam, PatchSessionsBodyParam, PatchSessionsMetadataParam, PatchSettingsBodyParam, PatchSettingsMetadataParam, PatchShopCategoriesBodyParam, PatchShopCategoriesMetadataParam, PatchShopsBodyParam, PatchShopsCountriesBodyParam, PatchShopsCountriesMetadataParam, PatchShopsDevicesBodyParam, PatchShopsDevicesMetadataParam, PatchShopsMetadataParam, PatchShopsOsBodyParam, PatchShopsOsMetadataParam, PatchShopsUserBodyParam, PatchShopsUserMetadataParam, PatchSmsBodyParam, PatchSmsBonusItemsBodyParam, PatchSmsBonusItemsMetadataParam, PatchSmsBonusesBodyParam, PatchSmsBonusesMetadataParam, PatchSmsMailingMessagesBodyParam, PatchSmsMailingMessagesMetadataParam, PatchSmsMailingsBodyParam, PatchSmsMailingsMetadataParam, PatchSmsMetadataParam, PatchStatGameBodyParam, PatchStatGameMetadataParam, PatchStatisticsAddBodyParam, PatchStatisticsAddMetadataParam, PatchStatisticsBodyParam, PatchStatisticsMetadataParam, PatchSubsessionsBodyParam, PatchSubsessionsMetadataParam, PatchTasksBodyParam, PatchTasksMetadataParam, PatchTicketsAnswersBodyParam, PatchTicketsAnswersMetadataParam, PatchTicketsBodyParam, PatchTicketsMetadataParam, PatchTournamentBotsBodyParam, PatchTournamentBotsMetadataParam, PatchTournamentCategoriesBodyParam, PatchTournamentCategoriesMetadataParam, PatchTournamentGamesBodyParam, PatchTournamentGamesMetadataParam, PatchTournamentPrizesBodyParam, PatchTournamentPrizesMetadataParam, PatchTournamentStatsBodyParam, PatchTournamentStatsMetadataParam, PatchTournamentsBodyParam, PatchTournamentsMetadataParam, PatchUserActivityBodyParam, PatchUserActivityMetadataParam, PatchUsersBodyParam, PatchUsersMetadataParam, PatchWelcomebonusesBodyParam, PatchWelcomebonusesMetadataParam, PatchWheelfortuneBodyParam, PatchWheelfortuneMetadataParam, PatchWithdrafundsBodyParam, PatchWithdrafundsMetadataParam, PostAdminBodyParam, PostAdminMetadataParam, PostApiTokensBodyParam, PostApiTokensMetadataParam, PostApisBodyParam, PostApisMetadataParam, PostArticlesBodyParam, PostArticlesMetadataParam, PostAtmBodyParam, PostAtmMetadataParam, PostCacheBodyParam, PostCacheMetadataParam, PostCategoriesBodyParam, PostCategoriesMetadataParam, PostCreditsBodyParam, PostCreditsMetadataParam, PostFailedJobsBodyParam, PostFailedJobsMetadataParam, PostFaqsBodyParam, PostFaqsMetadataParam, PostFishBankBodyParam, PostFishBankMetadataParam, PostGameBankBodyParam, PostGameBankMetadataParam, PostGameCategoriesBodyParam, PostGameCategoriesMetadataParam, PostGameLogBodyParam, PostGameLogMetadataParam, PostGamesBodyParam, PostGamesMetadataParam, PostHappyhoursBodyParam, PostHappyhoursMetadataParam, PostInfoBodyParam, PostInfoMetadataParam, PostInfoShopBodyParam, PostInfoShopMetadataParam, PostInvitesBodyParam, PostInvitesMetadataParam, PostJobsBodyParam, PostJobsMetadataParam, PostJpgBodyParam, PostJpgMetadataParam, PostMessagesBodyParam, PostMessagesMetadataParam, PostMigrationsBodyParam, PostMigrationsMetadataParam, PostNotificationsBodyParam, PostNotificationsMetadataParam, PostOpenShiftBodyParam, PostOpenShiftMetadataParam, PostOpenShiftTempBodyParam, PostOpenShiftTempMetadataParam, PostPasswordResetsBodyParam, PostPasswordResetsMetadataParam, PostPayTicketsBodyParam, PostPayTicketsMetadataParam, PostPaymentSettingsBodyParam, PostPaymentSettingsMetadataParam, PostPaymentsBodyParam, PostPaymentsMetadataParam, PostPermissionRoleBodyParam, PostPermissionRoleMetadataParam, PostPermissionUserBodyParam, PostPermissionUserMetadataParam, PostPermissionsBodyParam, PostPermissionsMetadataParam, PostPhinxlogBodyParam, PostPhinxlogMetadataParam, PostPincodesBodyParam, PostPincodesMetadataParam, PostProgressBodyParam, PostProgressMetadataParam, PostProgressUsersBodyParam, PostProgressUsersMetadataParam, PostQuickShopsBodyParam, PostQuickShopsMetadataParam, PostRewardsBodyParam, PostRewardsMetadataParam, PostRoleUserBodyParam, PostRoleUserMetadataParam, PostRolesBodyParam, PostRolesMetadataParam, PostRulesBodyParam, PostRulesMetadataParam, PostSecuritiesBodyParam, PostSecuritiesMetadataParam, PostSessionsBodyParam, PostSessionsMetadataParam, PostSettingsBodyParam, PostSettingsMetadataParam, PostShopCategoriesBodyParam, PostShopCategoriesMetadataParam, PostShopsBodyParam, PostShopsCountriesBodyParam, PostShopsCountriesMetadataParam, PostShopsDevicesBodyParam, PostShopsDevicesMetadataParam, PostShopsMetadataParam, PostShopsOsBodyParam, PostShopsOsMetadataParam, PostShopsUserBodyParam, PostShopsUserMetadataParam, PostSmsBodyParam, PostSmsBonusItemsBodyParam, PostSmsBonusItemsMetadataParam, PostSmsBonusesBodyParam, PostSmsBonusesMetadataParam, PostSmsMailingMessagesBodyParam, PostSmsMailingMessagesMetadataParam, PostSmsMailingsBodyParam, PostSmsMailingsMetadataParam, PostSmsMetadataParam, PostStatGameBodyParam, PostStatGameMetadataParam, PostStatisticsAddBodyParam, PostStatisticsAddMetadataParam, PostStatisticsBodyParam, PostStatisticsMetadataParam, PostSubsessionsBodyParam, PostSubsessionsMetadataParam, PostTasksBodyParam, PostTasksMetadataParam, PostTicketsAnswersBodyParam, PostTicketsAnswersMetadataParam, PostTicketsBodyParam, PostTicketsMetadataParam, PostTournamentBotsBodyParam, PostTournamentBotsMetadataParam, PostTournamentCategoriesBodyParam, PostTournamentCategoriesMetadataParam, PostTournamentGamesBodyParam, PostTournamentGamesMetadataParam, PostTournamentPrizesBodyParam, PostTournamentPrizesMetadataParam, PostTournamentStatsBodyParam, PostTournamentStatsMetadataParam, PostTournamentsBodyParam, PostTournamentsMetadataParam, PostUserActivityBodyParam, PostUserActivityMetadataParam, PostUsersBodyParam, PostUsersMetadataParam, PostWelcomebonusesBodyParam, PostWelcomebonusesMetadataParam, PostWheelfortuneBodyParam, PostWheelfortuneMetadataParam, PostWithdrafundsBodyParam, PostWithdrafundsMetadataParam } from './types';
