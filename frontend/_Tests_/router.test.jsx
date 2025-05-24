import { router } from '../src/router';
import App from '../src/App';
import Signup from '../src/components/Signup';
import Signin from '../src/components/Signin';
import Dashboard from '../src/components/Dashboard';
import PrivateRoute from '../src/components/PrivateRoute';
import ContactForm from '../src/components/ContactForm';
import PrivacyPolicy from '../src/components/PrivacyPolicy';
import ForgotPassword from '../src/components/ForgotPassword';
import ResetPassword from '../src/components/ResetPassword';
import AuthenticatedRoute from '../src/components/AuthenticatedRoute';
import SearchPage from '../src/components/SearchPage';
import AdminManager from '../src/components/AdminManager';
import AdminApplication from '../src/components/AdminApplication';
import AccountDashboard from '../src/components/AccountDashboard';
import Layout from '../src/components/layout';
import '@testing-library/jest-dom/vitest';

describe('router configuration', () => {
    it('should have a root route with Layout as element', () => {
        expect(router.routes[0].element.type).toBe(Layout);
    });

    it('should define all expected child routes', () => {
        const children = router.routes[0].children;
        const paths = children.map(r => r.path);
        expect(paths).toEqual([
            '/',
            '/signup',
            '/signin',
            '/dashboard',
            '/contact',
            '/privacypolicy',
            '/forgotpassword',
            '/resetpassword',
            '/search',
            '/admin-manager',
            '/adminapplication',
            '/account'
        ]);
    });

    it('should render App component at "/"', () => {
        const route = router.routes[0].children.find(r => r.path === '/');
        expect(route.element.type).toBe(App);
    });

    it('should render ContactForm at "/contact"', () => {
        const route = router.routes[0].children.find(r => r.path === '/contact');
        expect(route.element.type).toBe(ContactForm);
    });

    it('should render PrivacyPolicy at "/privacypolicy"', () => {
        const route = router.routes[0].children.find(r => r.path === '/privacypolicy');
        expect(route.element.type).toBe(PrivacyPolicy);
    });

    it('should render ForgotPassword at "/forgotpassword"', () => {
        const route = router.routes[0].children.find(r => r.path === '/forgotpassword');
        expect(route.element.type).toBe(ForgotPassword);
    });

    it('should render SearchPage at "/search"', () => {
        const route = router.routes[0].children.find(r => r.path === '/search');
        expect(route.element.type).toBe(SearchPage);
    });

    it('should render AdminManager at "/admin-manager"', () => {
        const route = router.routes[0].children.find(r => r.path === '/admin-manager');
        expect(route.element.type).toBe(AdminManager);
    });

    it('should render AdminApplication at "/adminapplication"', () => {
        const route = router.routes[0].children.find(r => r.path === '/adminapplication');
        expect(route.element.type).toBe(AdminApplication);
    });
});