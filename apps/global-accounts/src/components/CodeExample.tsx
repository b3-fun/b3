import { motion } from "framer-motion";
import tsx from "react-syntax-highlighter/dist/cjs/languages/prism/tsx";
import SyntaxHighlighter from "react-syntax-highlighter/dist/cjs/prism-light";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";

// Register the language
SyntaxHighlighter.registerLanguage("tsx", tsx);

const codeExample = `import { SignInWithB3, B3Provider } from '@b3dotfun/sdk/global-account';

function App() {
  return (
    <B3Provider environment="production">
      <SignInWithB3
        onLoginSuccess={(globalAccount) => {
          console.log('User authenticated with Global Account!', globalAccount);
        }}
        partnerId={"AWESOME-PARTNER"}
      />
    </B3Provider>
  );
}`;

export function CodeExample() {
  return (
    <section className="bg-gray-50 py-24">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="mx-auto max-w-4xl"
        >
          <h2 className="font-calibre mb-8 text-center text-4xl font-bold">Add Global Accounts in Minutes</h2>
          <p className="mb-12 text-center text-xl text-gray-600">
            Integrate powerful Web3 authentication with just a few lines of code
          </p>
          <div className="overflow-hidden rounded-xl [&_.token]:!bg-transparent [&_code]:!bg-transparent [&_pre]:!bg-[#1E1E1E] [&_pre]:!p-8">
            {/* @ts-ignore */}
            <SyntaxHighlighter language="tsx" style={oneDark} wrapLines={true}>
              {codeExample}
            </SyntaxHighlighter>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
