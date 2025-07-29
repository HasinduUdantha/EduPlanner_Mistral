import { StyleSheet, Dimensions } from 'react-native';


const { height } = Dimensions.get('window');


export const commonStyles = StyleSheet.create({
   gradient: {
       flex: 1,
   },
   container: {
       flex: 1,
   },
   scrollContainer: {
       flexGrow: 1,
       justifyContent: 'center',
       padding: 20,
       minHeight: height,
   },
   loadingContainer: {
       flex: 1,
       justifyContent: 'center',
       alignItems: 'center',
   },
   loadingText: {
       fontSize: 24,
       fontWeight: 'bold',
       color: 'white',
       marginTop: 16,
   },
   header: {
       alignItems: 'center',
       marginBottom: 40,
   },
   logoContainer: {
       width: 80,
       height: 80,
       borderRadius: 40,
       backgroundColor: 'white',
       justifyContent: 'center',
       alignItems: 'center',
       marginBottom: 16,
   },
   appTitle: {
       fontSize: 32,
       fontWeight: 'bold',
       color: 'white',
       marginBottom: 8,
   },
   subtitle: {
       fontSize: 16,
       color: 'rgba(255, 255, 255, 0.9)',
       textAlign: 'center',
   },
   card: {
       borderRadius: 24,
       backgroundColor: 'white',
   },
   cardContent: {
       padding: 32,
   },
   title: {
       fontSize: 28,
       fontWeight: 'bold',
       color: '#1f2937',
       textAlign: 'center',
       marginBottom: 8,
   },
   description: {
       fontSize: 16,
       color: '#6b7280',
       textAlign: 'center',
       marginBottom: 32,
   },
   inputContainer: {
       marginBottom: 16,
   },
   input: {
       backgroundColor: 'white',
   },
   termsText: {
       fontSize: 12,
       color: '#6b7280',
       textAlign: 'center',
       marginBottom: 24,
       lineHeight: 18,
   },
   linkText: {
       color: '#4facfe',
       fontWeight: '600',
   },
   signupButton: {
       borderRadius: 12,
       marginBottom: 24,
   },
   signupButtonContent: {
       paddingVertical: 8,
   },
   loginContainer: {
       flexDirection: 'row',
       justifyContent: 'center',
       alignItems: 'center',
   },
   loginText: {
       color: '#6b7280',
       fontSize: 16,
   },
   loginButtonText: {
       color: '#4facfe',
       fontSize: 16,
       fontWeight: '600',
   },
   snackbar: {
       marginBottom: 20,
   },
   errorText: {
       color: '#ef4444',
       fontSize: 12,
       marginTop: 4,
       marginLeft: 12,
   },
});

